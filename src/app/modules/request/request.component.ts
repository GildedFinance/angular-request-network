import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { IfObservable } from 'rxjs/observable/IfObservable';

@Component({
  selector: 'app-request',
  templateUrl: './request.component.html',
  styleUrls: ['./request.component.css']
})
export class RequestComponent implements OnInit {

  currentAccount: Observable<any>;
  payee = '0x662a3202A69E88A82B48e79EBeE36A9cE98A0508'; // Change this to your receive address to make development easier
  amount = '0.1';
  step = 1;
  request: any;

  constructor(
    private web3Service: Web3Service
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