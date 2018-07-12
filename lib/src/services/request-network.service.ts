import { Injectable } from '@angular/core';
import ProviderEngine from 'web3-provider-engine';
import RpcSubprovider from 'web3-provider-engine/subproviders/rpc';
import LedgerWalletSubprovider from 'ledger-wallet-provider';
import RequestNetwork, { Types } from '@requestnetwork/request-network.js';
import { ResponseMessage } from '../models/request.model';
import { Subject, BehaviorSubject } from 'rxjs';

declare let window: any, require: any;

const Web3 = require('web3');

@Injectable()
export class RequestNetworkService {
  private web3;
  private requestNetwork: RequestNetwork;
  private infuraNodeUrl = {
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

  private web3NotReadyMsg = 'Error when trying to instanciate web3.';
  // tslint:disable-next-line:max-line-length
  private requestNetworkNotReadyMsg =
    'Request Network smart contracts are not deployed on this network. Please use Mainnet or Rinkeby Testnet.';
  private walletNotReadyMsg = 'Connect your Metamask or Ledger wallet to create or interact with a Request.';

  public fromWei;
  public toWei;
  public BN;
  public isAddress;

  constructor() {
    this.checkAndInstantiateWeb3();
    this.networkIdObservable.subscribe(networkId => this.setEtherscanUrl());
    setInterval(async _ => await this.refreshAccounts(), 1000);
  }

  public checkLedger(networkId, derivationPath) {
    return new Promise(async (resolve, reject) => {
      const ledgerWalletSubProvider = await LedgerWalletSubprovider(() => networkId, derivationPath);
      const ledger = ledgerWalletSubProvider.ledger;

      if (!ledger.isU2FSupported) {
        reject('Ledger Wallet uses U2F which is not supported by your browser.');
      }

      ledger
        .getMultipleAccounts(derivationPath, 0, 10)
        .then(async res => {
          const engine = new ProviderEngine();
          engine.addProvider(ledgerWalletSubProvider);
          engine.addProvider(new RpcSubprovider({ rpcUrl: this.infuraNodeUrl[networkId] }));
          engine.start();
          const web3 = new Web3(engine);
          const addresses = (<any>Object).entries(res).map(e => ({ derivationPath: e[0], address: e[1], balance: 0 }));
          for (const address of addresses) {
            address.balance = this.fromWei(await web3.eth.getBalance(address.address.toString()));
          }
          resolve(addresses);
        })
        .catch(err => {
          if (err.metaData && err.metaData.code === 5) {
            reject('Timeout error. Please verify your ledger is connected and the Ethereum application opened.');
          } else if (err === 'Invalid status 6801') {
            reject('Invalid status 6801. Check to make sure the right application is selected on your ledger.');
          }
        });
    });
  }

  public async instanciateWeb3FromLedger(networkId, derivationPath) {
    const ledgerWalletSubProvider = await LedgerWalletSubprovider(() => networkId, derivationPath);
    const engine = new ProviderEngine();
    engine.addProvider(ledgerWalletSubProvider);
    engine.addProvider(new RpcSubprovider({ rpcUrl: this.infuraNodeUrl[networkId] }));
    engine.start();

    this.checkAndInstantiateWeb3(new Web3(engine));
    this.showResponse('Ledger Wallet successfully connected.', 'success');
    this.ledgerConnected = true;
  }

  public async checkAndInstantiateWeb3(web3?) {
    if (web3 || typeof window.web3 !== 'undefined') {
      // tslint:disable-next-line:max-line-length
      console.info(
        `Using web3 detected from external source.
        If you find that your accounts don\'t appear, ensure you\'ve configured that source properly.`
      );

      if (web3) {
        // if Ledger wallet
        this.web3 = web3;
        this.refreshAccounts(true);
      } else {
        // if Web3 has been injected by the browser (Mist/MetaMask)
        this.metamask = window.web3.currentProvider.isMetaMask;
        this.ledgerConnected = false;
        this.web3 = new Web3(window.web3.currentProvider);
      }
      const networkId = await this.web3.eth.net.getId();
      this.networkIdObservable.next(networkId);
    } else {
      console.warn(`No web3 detected. Falling back to ${this.infuraNodeUrl[1]}.`);
      this.networkIdObservable.next(1); // mainnet by default
      this.web3 = new Web3(new Web3.providers.HttpProvider(this.infuraNodeUrl[1]));
    }

    // instanciate requestnetwork.js
    try {
      this.requestNetwork = new RequestNetwork(this.web3.currentProvider, this.networkIdObservable.value);
    } catch (err) {
      this.showResponse(this.requestNetworkNotReadyMsg);
      console.error(err);
    }

    this.fromWei = this.web3.utils.fromWei;
    this.toWei = this.web3.utils.toWei;
    this.isAddress = this.web3.utils.isAddress;
    this.BN = mixed => new this.web3.utils.BN(mixed);
  }

  private async refreshAccounts(force?: boolean) {
    if (this.ledgerConnected && !force) {
      return;
    }

    const accs = await this.web3.eth.getAccounts();
    if (!accs || accs.length === 0) {
      this.accountObservable.next(null);
    } else if (this.accountObservable.value !== accs[0]) {
      this.accountObservable.next(accs[0]);
    }

    if (this.web3Ready === undefined) {
      this.web3Ready = true;
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

  private watchDog() {
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
    } else if (request.state === 1) {
      if (request.payee.balance.isZero()) {
        request.status = 'accepted';
      } else if (request.payee.balance.lt(request.payee.expectedAmount)) {
        request.status = 'in progress';
      } else if (request.payee.balance.eq(request.payee.expectedAmount)) {
        request.status = 'complete';
      } else if (request.payee.balance.gt(request.payee.expectedAmount)) {
        request.status = 'overpaid';
      }
    } else {
      request.status = 'created';
    }
  }

  private confirmTxOnLedgerMsg() {
    if (this.ledgerConnected) {
      setTimeout(_ => {
        this.showResponse('Please confirm transaction on your ledger.', 'info');
      }, 1500);
    }
  }

  /**
   * Create Request as Payee
   * @deprecated now used with createRequest method
   * @param payee
   * @param expectedAmount
   * @param data
   * @param callback
   */
  public createRequestAsPayee(payee: string, expectedAmount: string, data: string, callback?) {
    if (this.watchDog()) {
      return callback();
    }
    if (!this.web3.utils.isAddress(payee)) {
      return callback({
        message: `payee's address is not a valid Ethereum address`
      });
    }

    const expectedAmountInWei = this.toWei(expectedAmount, 'ether');
    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.requestEthereumService.createRequestAsPayee(
      [this.accountObservable.value],
      [expectedAmountInWei],
      payee,
      null,
      null,
      data
    );
  }

  /**
   * Create Request as Payer
   * @deprecated now used with createRequest method
   * @param payer
   * @param expectedAmount
   * @param data
   * @param callback
   */
  public createRequestAsPayer(_payeesIdAddress: string, expectedAmount: string, data: string, callback?) {
    if (this.watchDog()) {
      return callback();
    }
    if (!this.web3.utils.isAddress(_payeesIdAddress)) {
      return callback({
        message: `Payment receiver's address is not a valid Ethereum address`
      });
    }
    const expectedAmountInWei = this.toWei(expectedAmount, 'ether');
    this.confirmTxOnLedgerMsg();

    return this.requestNetwork.requestEthereumService.createRequestAsPayer(
      [_payeesIdAddress],
      [expectedAmountInWei],
      this.accountObservable.value,
      null,
      null,
      data
    );
  }

  /**
   * In progress...
   * Create custom request
   * @param requestSimpleData
   */
  public createRequest(
    payerAddress: string,
    role: Types.Role,
    currency: Types.Currency,
    amount: number,
    requestOptions: Types.IRequestCreationOptions,
    callback?
  ) {
    if (this.watchDog()) return callback();
    if (!this.web3.utils.isAddress(payerAddress)) {
      return callback({
        message: `Payment receiver's address is not a valid address`
      });
    }

    const expectedAmountInWei = this.toWei(amount.toString(), 'ether');

    let payee, payer, amountToPayAtCreation: string;
    // as: Types.Role, currency: Types.Currency, payees: Types.IPayee[], payer: Types.IPayer,
    // requestOptions: Types.IRequestCreationOptions = {}
    const connectedAccount = this.accountObservable.value; // current metamask address

    if (role === Types.Role.Payer) {
      payee = payerAddress;
      payer = connectedAccount;
      amountToPayAtCreation = expectedAmountInWei;
    } else if (role === Types.Role.Payee) {
      payee = connectedAccount;
      payer = payerAddress;
    }

    return this.requestNetwork.createRequest(
      role,
      currency,
      [
        {
          idAddress: payee,
          paymentAddress: payee,
          additional: 0,
          expectedAmount: expectedAmountInWei,
          amountToPayAtCreation: amountToPayAtCreation
        }
      ],
      {
        idAddress: payer,
        refundAddress: payer
      },
      requestOptions
    );
    // // Pay a request
    // await request.pay([amount], [0], { from: payerAddress });
    // ​
    // // The balance is the same amount as the the expected amount: the request is paid
    // const data = await request.getData();
    // console.log(data.payee.expectedAmount.toString());
    // console.log(data.payee.balance.toString());
  }

  /**
   * Create Request Instance from request id
   * @param string requestId The ID of the Request
   * @returns Request The Request
   */
  public fromRequestId(requestId: string) {
    return this.requestNetwork.fromRequestId(requestId);
  }

  /**
   * Create Request Instance from a transaction hash
   * @param string txHash Transaction hash
   * @returns Promise<{request, transaction, warnings, errors}>
   */
  public fromTransactionHash(txHash: string) {
    return this.requestNetwork.fromTransactionHash(txHash);
  }

  public cancel(requestId: string, callback?) {
    if (this.watchDog()) {
      return callback();
    }
    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.requestEthereumService.cancel(requestId);
  }

  public accept(requestId: string, callback?) {
    if (this.watchDog()) {
      return callback();
    }
    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.requestEthereumService.accept(requestId);
  }

  public subtractAction(requestId: string, amount: string, callback?) {
    if (this.watchDog()) {
      return callback();
    }
    const amountInWei = this.toWei(amount.toString(), 'ether');
    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.requestEthereumService.subtractAction(requestId, [amountInWei]);
  }

  public additionalAction(requestId: string, amount: string, callback?) {
    if (this.watchDog()) {
      return callback();
    }
    const amountInWei = this.toWei(amount.toString(), 'ether');
    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.requestEthereumService.additionalAction(requestId, [amountInWei]);
  }

  public paymentAction(requestId: string, amount: string, callback?) {
    if (this.watchDog()) {
      return callback();
    }
    const amountInWei = this.toWei(amount.toString(), 'ether');
    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.requestEthereumService.paymentAction(requestId, [amountInWei], []);
  }

  public refundAction(requestId: string, amount: string, callback?) {
    if (this.watchDog()) {
      return callback();
    }
    const amountInWei = this.toWei(amount.toString(), 'ether');
    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.requestEthereumService.refundAction(requestId, amountInWei);
  }

  public async getRequestByRequestId(requestId: string) {
    try {
      const request = await this.requestNetwork.requestCoreService.getRequest(requestId);
      this.setRequestStatus(request);
      return request;
    } catch (err) {
      console.error('Error: ', err.message);
      return err;
    }
  }

  public async getRequestByTransactionHash(txHash: string) {
    try {
      const response = await this.requestNetwork.requestCoreService.getRequestByTransactionHash(txHash);
      return response;
    } catch (err) {
      console.error('Error: ', err.message);
      return err;
    }
  }

  public async getRequestEvents(requestId: string) {
    try {
      const events = await this.requestNetwork.requestCoreService.getRequestEvents(requestId);
      return events.sort((a, b) => b._meta.timestamp - a._meta.timestamp);
    } catch (err) {
      console.error('Error: ', err.message);
      return err;
    }
  }

  public async getRequestsByAddress(address: string) {
    try {
      const requests = await this.requestNetwork.requestCoreService.getRequestsByAddress(address);
      return requests;
    } catch (err) {
      console.error('Error: ', err.message);
      return err;
    }
  }

  public broadcastSignedRequestAsPayer(signedRequest: string, amountsToPay: any[], callback?) {
    if (this.watchDog()) {
      return callback();
    }
    this.confirmTxOnLedgerMsg();
    return this.requestNetwork.requestEthereumService.broadcastSignedRequestAsPayer(signedRequest, amountsToPay);
  }

  public async getIpfsData(hash: string) {
    try {
      const result = await this.requestNetwork.requestCoreService.getIpfsFile(hash);
      return JSON.parse(result);
    } catch (err) {
      console.error('Error: ', err.message);
      return err;
    }
  }

  public isSignedRequestHasError(signedRequest: any, payer: string) {
    return this.requestNetwork.requestEthereumService.isSignedRequestHasError(signedRequest, payer);
  }
}
