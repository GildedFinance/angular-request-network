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
  payee = '0x662a3202A69E88A82B48e79EBeE36A9cE98A0508'; // Change this to your receive address to make development easier
  amount = '0.1';
  reason = '';

  step = 1;
  request: any;

  constructor(
    public web3Service: Web3Service
  ) {}

  ngOnInit() {
    this.currentAccount = this.web3Service.accountObservable;
  }

  async createInvoice() {
    this.step = 2;
    const request = await this.web3Service.createRequestAsPayee(this.payee, this.amount, '');

    if (request) {
      this.request = request;
      this.step = 3;
    } else {
      this.step = -1;
    }
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
