# Angular Request Network Library

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.0.x.

## We have a prepared a scaffold project in Github:

[Angular Request Network](https://github.com/GildedFinance/angular-request-network)
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`.
The app will automatically reload if you change any of the source files.

## Further help for CLI commands

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Request Network Service supported methods

Documentation about Request Network JS Library:
[Request Library API](https://docs-js-lib.request.network/index.html)

Request Network Service:

```
  # method to create new request as Payer or Payee for different currencies
  createRequest(
    payerAddress: string, role: Types.Role, currency: Types.Currency,
    amount: number, requestOptions: Types.IRequestCreationOptions, callback?)

  # method to get request instance by request id
  getRequestByRequestId(
    requestId: string
  )

  # method to get request instance by generated transaction hash
  getRequestByTransactionHash(
    txHash: string
  )

  # method to get request instance by address
  getRequestsByAddress(
    txHash: string
  )

  # method to get request events
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
