import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { RequestNetworkService, RequestResponse } from 'angular-request-network';
import { Types } from '@requestnetwork/request-network.js';
import { Observable } from 'rxjs';

declare let window: any;

import * as Web3 from 'web3';

@Component({
  selector: 'app-request',
  templateUrl: './request.component.html',
  styleUrls: ['./request.component.scss']
})
export class RequestComponent implements OnInit {
  currentAccount: Observable<any>;

  // ng model
  payee = '0x5129F06d1E500B342807592c2d04EAE664eb52B2'; // Change this to your receive address to make development easier
  amount = 0.1;
  reason = '';

  step = 1;
  createLoading = false;
  request: any;
  requestData: Observable<any>;

  // store new request response data
  requestResponse: RequestResponse = new RequestResponse();

  constructor(public requestNetworkService: RequestNetworkService, public toastrService: ToastrService) {}

  ngOnInit() {
    this.currentAccount = this.requestNetworkService.accountObservable;
  }

  /**
   * Step 1: Start new request by clicking button Create Invoice
   */
  async createInvoicePayee() {
    this.requestNetworkService.enableWeb3().then(_ => {
      this._createRequest(Types.Role.Payee);
    });
  }

  /**
   * Step 1: Start new request by clicking button Create Invoice
   */
  async createInvoicePayer() {
    this.requestNetworkService.enableWeb3().then(_ => {
      this._createRequest(Types.Role.Payer);
    });
  }

  private async _createRequest(role: Types.Role) {
    this.createLoading = true;
    const payer = this.requestNetworkService.accountObservable.value;
    const amount = String(this.amount);

    this.requestNetworkService
      // .createRequestAsPayer(this.payee, String(this.amount), JSON.stringify({ reason: this.reason }), this._callbackRequest)
      .createRequestAndPay(this.payee, amount, 'ETH', payer, { data: { reason: this.reason } }, null, this._callbackRequest)
      .on('broadcasted', response => this._callbackRequest(response))
      .then(resp => {
        this._callbackForPayment(resp);
        return resp;
      })
      .catch(err => {
        this._handleErrors(err);
      });
  }

  /**
   * Step 1 Callback Success
   * @param requestResponse
   */
  private _callbackForPayment(requestResponse: any) {
    console.log(requestResponse, 'REQ Response');
    this.requestResponse.request = requestResponse;
    this.request = requestResponse.request;
    this.request.getData().then(requestData => {
      this.requestData = requestData.data.data;

      // move to payment step
      this.step = 3;
    });

    console.log(this.request, '_callbackForPayment Request');
  }

  /**
   * Step 1: Callback Function
   */
  private _callbackRequest(response: any) {
    console.log(response);
    if (response && response.transaction) {
      // created transaction
      this.requestResponse['transaction'] = response.transaction;

      // move to step 2: show loading
      this.step = 2;
    } else {
      // request.message  | failed
      console.error(response, '_callbackRequestError');
      // this._handleRequestErrors(response.message);
    }
  }

  // step 3: After successful request completed show button to payInvoice
  payInvoice() {
    this.step = 4;
    // call payment action (pass request Id as parameter and amount to be paid)
    // pay(requestObject: any, amount: string, transactionOptions?: any): any;
    this.requestNetworkService
      .pay(this.request, this.amount.toString(), this._callbackPayment)
      .on('broadcasted', response => {
        this._callbackPayment(response, 'Payment is being done. Please wait a few moments for it to appear on the Blockchain.');
      })
      .then(
        () => {
          this.step = 5;
          this.toastrService.success('Payment completed', 'RQN Payment');
          this.createLoading = false; // stop loading
        },
        err => {
          this._handleErrors(err);
        }
      );
  }

  private _callbackPayment(response, msg?) {
    if (response.transaction) {
      this.toastrService.success(msg || 'Transaction in progress.', 'RQN Payment');
      // this.loading = response.transaction.hash;
      // this.watchTxHash(this.loading);
    } else if (response.message) {
      this._handleErrors(response.message);
    }
  }

  private showToastr(message: string, title: string, type: string) {
    switch (type) {
      case 'info':
        this.toastrService.info(message, title);
        break;
      case 'warning':
        this.toastrService.warning(message, title);
        break;
      case 'success':
        this.toastrService.success(message, title);
        break;
      case 'error':
        this.toastrService.error(message, title);
        break;
    }
  }

  /**
   *
   * @param error { stack: any, message: any }
   */
  private _handleErrors(error: any) {
    const message = error.message;

    if (message.startsWith('Invalid status 6985')) {
      const responseMessage = this.requestNetworkService.showResponse('Invalid status 6985. User denied transaction.');
      this.showToastr(responseMessage.message, 'REQ Request', 'warning');
    } else if (message.startsWith('Failed to subscribe to new newBlockHeaders')) {
      return;
    } else if (message.startsWith('Returned error: Error: MetaMask Tx Signature')) {
      const responseMessage = this.requestNetworkService.showResponse('MetaMask Tx Signature: User denied transaction signature.');
      this.showToastr(responseMessage.message, 'REQ Warning', 'warning');
    } else {
      this.showToastr(message, 'REQ Main Error', 'error');
    }

    // reset button
    this.createLoading = false;

    // navigate back
    if (this.step > 1) {
      this.step--;
    }
  }
}
