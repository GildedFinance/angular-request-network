import { Injectable } from '@angular/core';
import { ResponseMessage } from '../models/request.model';
import { Subject, BehaviorSubject } from 'rxjs';

import RequestNetwork, { utils, SignedRequest, Types } from '@requestnetwork/request-network.js';
import { GasService } from './gas.service';

declare let window: any;
import * as Web3 from 'web3';

@Injectable()
export class RequestNetworkService {
  private web3;
  private requestNetwork;
  public infuraNodeUrl = {
    1: 'https://mainnet.infura.io/BQBjfSi5EKSCQQpXebO',
    4: 'https://rinkeby.infura.io/BQBjfSi5EKSCQQpXebO'
  };

  public metamask = false;
  public ledgerConnected = false;
  public web3Ready: boolean;

  public etherscanUrl: string;

  public accountObservable = new BehaviorSubject<string>(null);
  public networkIdObservable = new BehaviorSubject<number>(null);
  public searchValue = new Subject<string>();

  private web3NotReadyMsg = 'Error when trying to instantiate web3.';
  private requestNetworkNotReadyMsg = 'Please use Mainnet or Rinkeby Testnet.';
  private walletNotReadyMsg = 'Connect your Metamask or Ledger wallet to create or interact with a Request.';

  public fromWei;
  public toWei;
  public BN;
  public isAddress;
  public getBlockNumber;

  constructor(
    private gasService: GasService
  ) {
    this.networkIdObservable.subscribe(networkId => this.setEtherscanUrl());
    this.networkIdObservable.next(1); // mainnet by default
    setInterval(async () => await this.refreshAccounts(), 1000);
  }

  public currencyFromContractAddress(address) {
    return Types.Currency[utils.currencyFromContractAddress(address)];
  }

  public getDecimalsForCurrency(currency) {
    return utils.decimalsForCurrency(Types.Currency[currency]);
  }

  public async enableWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.enable();
        this.setupWeb3();
        return true;

      } catch (error) {
        console.error('Web3 denied by user');
        console.error(error);
      }
    } else if (window.web3) {
      // Legacy dapp browsers...
      console.log('falling back to legacy dapp support');
      window.web3 = new Web3(window.web3.currentProvider);
      this.setupWeb3();
      return true;
    }

    this.enableFallbackWeb3();
    return false;
  }

  public async enableFallbackWeb3() {
    console.error('Ethereum or Web3 service not detected');
    this.web3 = new Web3(new Web3.providers.HttpProvider(this.infuraNodeUrl[1]));
    this.setupRequestNetwork();
  }

  private async setupWeb3() {
    console.log('setting up web3');
    this.metamask = window.web3.currentProvider.isMetaMask;
    this.web3 = new Web3(window.web3.currentProvider);

    const networkId = await this.web3.eth.net.getId();
    this.networkIdObservable.next(networkId);
    this.setupRequestNetwork();
  }

  private setupRequestNetwork() {
    try {
      this.requestNetwork = new RequestNetwork(this.web3.currentProvider, this.networkIdObservable.value);
    } catch (err) {
      this.showResponse(this.requestNetworkNotReadyMsg);
      console.error(err);
    }

    this.web3Ready = true;

    this.fromWei = this.web3.utils.fromWei;
    this.toWei = this.web3.utils.toWei;
    this.isAddress = this.web3.utils.isAddress;
    this.BN = mixed => new this.web3.utils.BN(mixed);
    this.getBlockNumber = this.web3.eth.getBlockNumber;
  }

  private async refreshAccounts(force?: boolean) {
    if (!this.web3) return;

    const accs = await this.web3.eth.getAccounts();
    if (accs && accs.length && this.accountObservable.value !== accs[0]) {
      this.accountObservable.next(accs[0]);
    }

    const networkId = await this.web3.eth.net.getId();
    this.networkIdObservable.next(networkId);
    if (this.networkIdObservable.value !== networkId) {
      this.networkIdObservable.next(networkId);
    }

  }

  private setEtherscanUrl() {
    switch (this.networkIdObservable.value) {
      case 1:
        this.etherscanUrl = 'https://etherscan.io/';
        break;
      case 3:
        this.etherscanUrl = 'https://ropsten.etherscan.io/';
        break;
      case 4:
        this.etherscanUrl = 'https://rinkeby.etherscan.io/';
        break;
      case 42:
        this.etherscanUrl = 'https://kovan.etherscan.io/';
        break;
      default:
        break;
    }
  }

  public watchDog() {
    const stop = !this.web3 || !this.requestNetwork || !this.accountObservable.value;
    if (stop) {
      this.showResponse();
    }
    return stop;
  }

  public showResponse(msg?: string, type?: string): ResponseMessage {
    if (!msg) {
      // tslint:disable-next-line:max-line-length
      msg = !this.web3
        ? this.web3NotReadyMsg
        : !this.requestNetwork
          ? this.requestNetworkNotReadyMsg
          : !this.accountObservable.value
            ? this.walletNotReadyMsg
            : '';
      if (msg === '') {
        return;
      }
    }

    const response = new ResponseMessage();
    response.message = msg;
    response.type = type ? type : 'info';
    return response;
  }

  public setSearchValue(searchValue: string) {
    this.searchValue.next(searchValue);
  }

  public setRequestStatus(request) {
    if (request.state === 2) {
      request.status = 'cancelled';
    } else {
      if (request.payee.balance.isZero()) {
        request.status = request.state === 1 ? 'accepted' : 'created';
      } else if (request.payee.balance.lt(request.payee.expectedAmount)) {
        request.status = 'in progress';
      } else if (request.payee.balance.eq(request.payee.expectedAmount)) {
        request.status = 'complete';
      } else if (request.payee.balance.gt(request.payee.expectedAmount)) {
        request.status = 'overpaid';
      } else {
        request.status = 'created';
      }
    }
  }

  private confirmTxOnLedgerMsg() {
    if (this.ledgerConnected) {
      setTimeout(() => {
        this.showResponse('Please confirm transaction on your Ledger.', 'info');
      }, 2000);
    }
  }

  /**
   * Create custom request
   * @param requestSimpleData
   */
  public createRequest(
    role: Types.Role,
    payerAddress: string,
    expectedAmount: string,
    currency: string,
    payeeAddress: string,
    requestOptions: any = {},
    refundAddress?: string,
    callback?
  ) {
    if (this.watchDog()) return callback();
    if (!this.web3.utils.isAddress(payerAddress)) {
      return callback({
        message: `Payment receiver's address is not a valid address`
      });
    }

    requestOptions.transactionOptions = {
      gasPrice: this.getGasPrice,
    };

    return this.requestNetwork.createRequest(
      Types.Role[role],
      Types.Currency[currency],
      [
        {
          idAddress: this.accountObservable.value,
          paymentAddress: payeeAddress,
          expectedAmount: this.amountToBN(expectedAmount, currency),
        },
      ],
      {
        idAddress: payerAddress,
        refundAddress: refundAddress ? refundAddress : undefined,
      },
      requestOptions
    );
  }

  /**
   * Create custom request
   * This method accepts only ETH currency
   * @param requestSimpleData
   */
  public createRequestAndPay(
    payerAddress: string,
    expectedAmount: string,
    currency: string,
    payeeAddress: string,
    requestOptions: any = {},
    refundAddress?: string,
    callback?
  ) {

    if (currency !== 'ETH') {
      return callback({
        message: 'This method accepts only ETH - Ethereum currency'
      });
    }

    if (this.watchDog()) return callback();

    if (!this.web3.utils.isAddress(payerAddress)) {
      return callback({
        message: `Payment receiver's address is not a valid address`
      });
    }

    requestOptions.transactionOptions = {
      gasPrice: this.getGasPrice,
    };

    const amountToPay = this.amountToBN(expectedAmount, currency);

    return this.requestNetwork.createRequest(
      Types.Role.Payer,
      Types.Currency.ETH,
      [
        {
          idAddress: this.accountObservable.value,
          paymentAddress: payeeAddress,
          expectedAmount: amountToPay,
          amountToPayAtCreation: amountToPay
        },
      ],
      {
        idAddress: payerAddress,
        refundAddress: refundAddress ? refundAddress : undefined,
      },
      requestOptions
    );
  }

  public cancel(requestObject: any, transactionOptions: any = { gasPrice: this.getGasPrice }) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return requestObject.cancel(transactionOptions);
  }

  public accept(requestObject: any, transactionOptions: any = { gasPrice: this.getGasPrice }) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return requestObject.accept(transactionOptions);
  }

  public subtract(requestObject: any, amount: string, transactionOptions: any = { gasPrice: this.getGasPrice }) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();

    return requestObject.addSubtractions([this.toWei(amount)], transactionOptions);
  }

  public additional(requestObject: any, amount: string, transactionOptions: any = { gasPrice: this.getGasPrice }) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return requestObject.addAdditionals([this.toWei(amount)], transactionOptions);
  }

  public pay(
    requestObject: any,
    amount: string,
    callback?,
    transactionOptions: any = {
      gasPrice: this.getGasPrice,
      skipERC20checkAllowance: true
    }
  ) {
    if (this.watchDog()) {
      return callback();
    }
    this.confirmTxOnLedgerMsg();

    transactionOptions.gasPrice = this.getGasPrice;
    return requestObject.pay([this.toWei(amount)], null, transactionOptions);
  }

  public refund(
    requestObject: any,
    amount: string,
    transactionOptions: any = {
      gasPrice: this.getGasPrice,
      skipERC20checkAllowance: true
    }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return requestObject.refund(this.toWei(amount), transactionOptions);
  }

  public allowSignedRequest(signedRequest: any, amount: string, transactionOptions: any = { gasPrice: this.getGasPrice }) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.requestERC20Service.approveTokenForSignedRequest(signedRequest, this.toWei(amount), transactionOptions);
  }

  public allow(requestId: string, amount: string, transactionOptions: any = { gasPrice: this.getGasPrice }) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.requestERC20Service.approveTokenForRequest(requestId, this.toWei(amount), transactionOptions);
  }

  public getAllowance(contractAddress: string) {
    if (this.watchDog()) {
      return;
    }
    return this.requestNetwork.requestERC20Service.getTokenAllowance(contractAddress);
  }

  public async createSignedRequest(payeesInfo) {
    const signedRequest = await this.requestNetwork.createSignedRequest(
      Types.Role.Payee,
      Types.Currency.ETH,
      payeesInfo,
      Date.now() + 3600 * 1000
    );

    return signedRequest;
  }

  public retrieveSignedRequest(signedRequestData) {
    const signedRequest = new SignedRequest(signedRequestData);
    return signedRequest;
  }

  public broadcastSignedRequestAsPayer(
    signedRequestObject: any,
    amountsToPay: any[],
    requestOptions: any = {
      transactionOptions: {
        gasPrice: this.getGasPrice,
        skipERC20checkAllowance: true
      }
    }
  ) {
    if (this.watchDog()) {
      return;
    }
    this.confirmTxOnLedgerMsg();

    return this.requestNetwork.broadcastSignedRequest(
      signedRequestObject,
      {
        idAddress: this.accountObservable.value
      },
      null,
      { amountsToPayAtCreation: amountsToPay },
      requestOptions
    );
  }

  public async getRequestByRequestId(requestId: string) {
    try {
      const request = await this.requestNetwork.fromRequestId(requestId);
      request.requestData = await request.getData();
      request.requestData.currency = Types.Currency[request.currency];
      this.setRequestStatus(request.requestData);
      return request;
    } catch (err) {
      console.log('Error: ', err.message);
      return err;
    }
  }

  public async getRequestByTransactionHash(txHash: string) {
    try {
      const response = await this.requestNetwork.requestCoreService.getRequestByTransactionHash(txHash);
      return response;
    } catch (err) {
      console.log('Error: ', err.message);
      return err;
    }
  }

  public async getRequestEvents(requestId: string) {
    try {
      const events = await this.requestNetwork.requestCoreService.getRequestEvents(requestId);
      return events.sort((a, b) => a._meta.timestamp - b._meta.timestamp);
    } catch (err) {
      console.log('Error: ', err.message);
      return err;
    }
  }

  public async getRequestsByAddress(address: string) {
    try {
      const requests = await this.requestNetwork.requestCoreService.getRequestsByAddress(address);
      return requests;
    } catch (err) {
      console.log('Error: ', err.message);
      return err;
    }
  }

  public async getIpfsData(hash: string) {
    try {
      const result = await this.requestNetwork.requestCoreService.getIpfsFile(hash);
      return JSON.parse(result);
    } catch (err) {
      console.log('Error: ', err.message);
      return err;
    }
  }

  public async buildRequestFromCreateRequestTransactionParams(transaction) {
    const request = {
      waitingMsg: 'Transaction found. Waiting for it to be mined...',
      creator: transaction.from,
      currency: this.currencyFromContractAddress(transaction.to),
      currencyContract: {
        address: transaction.to,
        payeePaymentAddress: transaction.method.parameters._payeesPaymentAddress[0] || null,
        payerRefundAddress: transaction.method.parameters._payerRefundAddress,
        subPayeesPaymentAddress: transaction.method.parameters._payeesPaymentAddress.slice(1)
      },
      data: {
        data: await this.getIpfsData(transaction.method.parameters._data),
        hash: transaction.method.parameters._data
      },
      payee: {
        address: transaction.method.parameters._payeesIdAddress[0],
        balance: this.BN(this.toWei('0')),
        expectedAmount: this.BN(transaction.method.parameters._expectedAmounts[0])
      },
      payer: transaction.method.parameters._payer,
      subPayees: []
    };

    for (const [index, subPayee] of transaction.method.parameters._payeesIdAddress.slice(1).entries) {
      subPayee[index] = {
        address: subPayee,
        balance: this.BN(this.toWei('0')),
        expectedAmount: this.BN(transaction.method.parameters._expectedAmounts[1 + index])
      };
    }

    return request;
  }

  get getGasPrice() {
    return this.gasService.gasPrice * 1000000000;
  }

  public amountToBN(amount, currency) {
    const comps = amount.split('.');
    currency = typeof currency === 'string' ? currency : Types.Currency[currency];
    const base = this.getDecimalsForCurrency(currency);

    if (!comps[0]) {
      comps[0] = '0';
    }
    if (!comps[1]) {
      comps[1] = '0';
    }
    while (comps[1].length < base) {
      comps[1] += '0';
    }
    comps[0] = this.BN(comps[0]);
    comps[1] = this.BN(comps[1]);

    return comps[0].mul(this.BN(10).pow(this.BN(base))).add(comps[1]);
  }

  public BNToAmount(bignumber, currency) {
    currency =
      typeof currency === 'string' ? currency : Types.Currency[currency];
    const base = this.getDecimalsForCurrency(currency);
    const negative = bignumber.lt(this.BN(0));

    if (negative) {
      bignumber = bignumber.mul(this.BN(-1));
    }

    let fraction = bignumber.mod(this.BN(10).pow(this.BN(base))).toString();
    const whole = bignumber.div(this.BN(10).pow(this.BN(base))).toString(10);

    while (fraction.length < base) {
      fraction = `0${fraction}`;
    }
    const matches = fraction.match(/^([0-9]*[1-9]|0)(0*)/);
    fraction = matches && matches[1] ? matches[1] : fraction;

    return `${negative ? '-' : ''}${whole}${
      fraction === '0' ? '' : `.${fraction}`
    }`;
  }
}
