import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BlockiesModule } from 'angular-blockies';
import { ToastrService } from 'ngx-toastr';
import { RequestNetworkService, RequestResponse } from 'angular-request-network';

@Component({
  selector: 'app-request',
  templateUrl: './request.component.html',
  styleUrls: ['./request.component.scss']
})
export class RequestComponent implements OnInit {
  currentAccount: Observable<any>;

  // ng model
  payee = '0x5129F06d1E500B342807592c2d04EAE664eb52B2'; // Change this to your receive address to make development easier
  amount = '0.1';
  reason = '';

  step = 1;
  createLoading = false;

  // store new request response data
  requestResponse: RequestResponse = new RequestResponse();

  constructor(public requestNetworkService: RequestNetworkService, public toastrService: ToastrService) {}

  ngOnInit() {
    this.currentAccount = this.requestNetworkService.accountObservable;
  }

  /**
   * Step 1: Start new request by clicking button Create Invoice
   */
  async createInvoice() {
    this.createLoading = true;

    // tslint:disable-next-line:max-line-length
    this.requestNetworkService
      .createRequestAsPayer(this.payee, String(this.amount), JSON.stringify({ reason: this.reason }), this._callbackRequest)
      .on('broadcasted', response => this._callbackRequest(response))
      .then(
        response => this._callbackForPayment(response), // assign response to variable
        err => this._handleRequestErrors(err)
      );
  }

  private _callbackForPayment(requestResponse: RequestResponse) {
    this.requestResponse = requestResponse;
    // move to payment step
    this.step = 3;

    console.log(this.requestResponse);
  }

  /**
   * Step 1: Callback Function
   */
  private _callbackRequest(response: RequestResponse) {
    console.log(response);
    if (response && response.transaction) {
      console.log(response, 'requestResponse 2');
      // created transaction
      this.requestResponse['transaction'] = response.transaction;

      // move to step 2: show loading
      this.step = 2;
    } else {
      // request.message  | failed
      console.error(response);
      // this._handleRequestErrors(response.message);
    }
  }

  private _handleRequestErrors(message: any) {
    console.error(message);
    if (message.startsWith('Invalid status 6985')) {
      const responseMessage = this.requestNetworkService.showResponse('Invalid status 6985. User denied transaction.');
      this.showToastr(responseMessage.message, 'RQN Request', 'warning');
    } else if (message.startsWith('Failed to subscribe to new newBlockHeaders')) {
      return;
    } else if (message.startsWith('Returned error: Error: MetaMask Tx Signature')) {
      const responseMessage = this.requestNetworkService.showResponse('MetaMask Tx Signature: User denied transaction signature.');
      this.showToastr(responseMessage.message, 'RQN Request', 'warning');
    }

    // reset button
    this.createLoading = false;

    // navigate back
    if (this.step > 1) {
      this.step--;
    }
  }

  // step 3: After successful request completed show button to payInvoice
  payInvoice() {
    this.step = 4;
    // call payment action (pass request Id as parameter and amount to be paid)
    this.requestNetworkService
      .paymentAction(this.requestResponse.request.requestId, this.amount, this._callbackPayment)
      .on('broadcasted', response => {
        this._callbackPayment(response, 'Payment is being done. Please wait a few moments for it to appear on the Blockchain.');
      })
      .then(
        response => {
          this.step = 5;
          this.toastrService.success('Payment completed', 'RQN Payment');
          this.createLoading = false; // stop loading
        },
        err => {
          this._handlePaymentErrors(err);
        }
      );
  }

  private _callbackPayment(response, msg?) {
    if (response.transaction) {
      this.toastrService.success(msg || 'Transaction in progress.', 'RQN Payment');
      // this.loading = response.transaction.hash;
      // this.watchTxHash(this.loading);
    } else if (response.message) {
      this._handlePaymentErrors(response.message);
    }
  }

  private _handlePaymentErrors(message: any) {
    if (message.startsWith('Invalid status 6985')) {
      const responseMessage = this.requestNetworkService.showResponse('Invalid status 6985. User denied transaction.');
      this.showToastr(responseMessage.message, 'RQN Payments', 'warning');
    } else if (message.startsWith('Failed to subscribe to new newBlockHeaders')) {
      return;
    } else if (message.startsWith('Returned error: Error: MetaMask Tx Signature')) {
      const responseMessage = this.requestNetworkService.showResponse('MetaMask Tx Signature: User denied transaction signature.');
      this.showToastr(responseMessage.message, 'RQN Payments', 'warning');
    } else {
      const responseMessage = this.requestNetworkService.showResponse(message);
      this.showToastr(responseMessage.message, 'RQN Payments', 'error');
    }

    // reset button
    this.createLoading = false;

    // navigate back
    if (this.step > 1) {
      this.step--;
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
}
