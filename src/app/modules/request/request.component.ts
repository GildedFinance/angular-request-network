import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { Observable } from 'rxjs/Observable';
import { BlockiesModule } from 'angular-blockies';

// object models
import { Request } from './models/request.model';
import { Transaction } from './models/transaction.model';

// request response object
export class RequestResponse {
  request: Request;
  transaction: Transaction;
  message: any;
}

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
  requestResponse: RequestResponse = new RequestResponse;

  constructor(
    public web3Service: Web3Service
  ) {}

  ngOnInit() {
    this.currentAccount = this.web3Service.accountObservable;
  }

  /**
   * Step 1: Start new request by clicking button Create Invoice
   */
  async createInvoice() {
    this.createLoading = true;

    this.web3Service.createRequestAsPayee(this.payee, String(this.amount), JSON.stringify({reason: this.reason}), this._callbackRequest)
      .on('broadcasted', response => this._callbackRequest(response))
      .then(
        response => this._callbackForPayment(response), // assign response to variable
        err => this._callbackRequest(err));
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
    if (response.transaction) {
      console.log(response, 'requestResponse 2');
      // created transaction
      this.requestResponse['transaction'] = response.transaction;

      // move to step 2: show loading
      this.step = 2;
    } else {
      // request.message  | failed
      this._handleRequestErrors(response.message);
    }
  }

  private _handleRequestErrors(message: any) {
    if (message.startsWith('Invalid status 6985')) {
      this.web3Service.openNotification('Invalid status 6985. User denied transaction.');
    } else if (message.startsWith('Failed to subscribe to new newBlockHeaders')) {
      return;
    } else if (message.startsWith('Returned error: Error: MetaMask Tx Signature')) {
      this.web3Service.openNotification('MetaMask Tx Signature: User denied transaction signature.');
    }

    // reset button
    this.createLoading = false;

    // navigate back
    if (this.step > 1) { this.step--; }
  }

  // step 3: After successful request completed show button to payInvoice
  payInvoice() {
    this.step = 4;
    // call payment action (pass request Id as parameter and amount to be paid)
    this.web3Service.paymentAction(this.requestResponse.request.requestId, this.amount, this._callbackPayment)
    .on('broadcasted', response => {
      this._callbackPayment(response, 'Payment is being done. Please wait a few moments for it to appear on the Blockchain.')
    }).then(
      response => {
        this.step = 5;
        this.web3Service.openNotification('Payment completed', 'ok');
        this.createLoading = false; // stop loading
      }, err => {
        this._handlePaymentErrors(err);
      });
  }

  private _callbackPayment(response, msg ? ) {
    if (response.transaction) {
      this.web3Service.openNotification(msg || 'Transaction in progress.', 'ok');
      // this.loading = response.transaction.hash;
      // this.watchTxHash(this.loading);
    } else if (response.message) {
     this._handlePaymentErrors(response.message);
    }
  }

  private _handlePaymentErrors(message: any) {
    if (message.startsWith('Invalid status 6985')) {
      this.web3Service.openNotification('Invalid status 6985. User denied transaction.');
    } else if (message.startsWith('Failed to subscribe to new newBlockHeaders')) {
      return;
    } else if (message.startsWith('Returned error: Error: MetaMask Tx Signature')) {
      this.web3Service.openNotification('MetaMask Tx Signature: User denied transaction signature.');
    } else {
      this.web3Service.openNotification(message);
    }

    // reset button
    this.createLoading = false;

    // navigate back
    if (this.step > 1) { this.step--; }
  }

}
