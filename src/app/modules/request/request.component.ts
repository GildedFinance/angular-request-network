import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { Observable } from 'rxjs/Observable';
import { BlockiesModule } from 'angular-blockies';

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
  request: any;
  createLoading = false;

  constructor(
    public web3Service: Web3Service
  ) {}

  ngOnInit() {
    this.currentAccount = this.web3Service.accountObservable;
  }

  async createInvoice() {
    this.createLoading = true;

    this.web3Service.createRequestAsPayee(this.payee, String(this.amount), JSON.stringify({reason: this.reason}), this._callbackRequest)
      .on('broadcasted', response => this._callbackRequest(response))
      .then(
        response => {},
        err => this._callbackRequest(err));
  }

  private _callbackRequest(request) {
    // reset button
    this.createLoading = false;


    if (request.transaction) {
        // successfull transaction
      this.request = request;
      this.step = 2;
    } else if (request.message) {
      // request.message  | failed
      this._handleErrorMessage(request.message);
    } else {
      this.web3Service.openNotification(request.message);

      // navigate back
      if (this.step > 1) { this.step--; }
    }
  }

  private _handleErrorMessage(message: any) {
    if (message.startsWith('Invalid status 6985')) {
      // this.web3Service.openSnackBar('Invalid status 6985. User denied transaction.');
    } else if (message.startsWith('Failed to subscribe to new newBlockHeaders')) {
      return;
    } else if (message.startsWith('Returned error: Error: MetaMask Tx Signature')) {
      this.web3Service.openNotification('MetaMask Tx Signature: User denied transaction signature.');
    }

    // navigate back
    if (this.step > 1) { this.step--; }
  }

  async payInvoice() {
    this.step = 4;
    const result = await this.web3Service.paymentAction(this.request, this.amount);

    if (result) {
      this.step = 5;
    } else {
      this.step = -1;
    }
  }

}
