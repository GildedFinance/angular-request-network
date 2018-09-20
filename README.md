# Angular Request Network Library

This npm package wraps [RequestNetwork.js](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/requestNetwork.js) and provides several useful additions for Angular applications:

- Check and instantiate connection to web3 (MetaMask, Toshi, etc)
- Determine the proper Etherscan URL based on the current network connect
- Provides Ledger hardware wallet support
- Retrieves data from IPFS
- Converts primitive numbers to [BigNumber](https://www.google.com/search?client=opera&q=bignumber&sourceid=opera&ie=UTF-8&oe=UTF-8)

See [request-network.service.ts](https://github.com/GildedFinance/angular-request-network/blob/master/lib/src/services/request-network.service.ts) for full usage information.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.0.x.

## Install
```npm install angular-request-network --save```

## Example Project

[Angular Request Network](https://github.com/GildedFinance/angular-request-network)
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`.
The app will automatically reload if you change any of the source files.

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Supported Methods of RequestNetwork.js

Full documentation for Request Network JS Library:
[Request Library API](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/requestNetwork.js)


```
  // method to create new request as Payer or Payee for different currencies
  createRequest(
    payerAddress: string, role: Types.Role, currency: Types.Currency,
    amount: number, requestOptions: Types.IRequestCreationOptions, callback?)

  // method to get request instance by request id
  getRequestByRequestId(
    requestId: string
  )

  // method to get request instance by generated transaction hash
  getRequestByTransactionHash(
    txHash: string
  )

  // method to get request instance by address
  getRequestsByAddress(
    txHash: string
  )

  // method to get request events
  getRequestsEvents(
    requestId: string
  )  

```

## Use `Request Network Service` in your Angular application

```
 // use import to the app.module or parent module of your project
 import { RequestNetworkModule, RequestNetworkService } from 'angular-request-network';

// import module in imports and service in providers
 @NgModule({
  schemas: xx,
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ...
    RequestNetworkModule.forRoot()
  ],
  providers: [ RequestNetworkService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```
