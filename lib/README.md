# Angular Request Network Library version 1.0.6

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.x.

## We have a prepared a scaffold project in Github: 
[Angular Request Network](https://github.com/GildedFinance/angular-request-network)
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. 
The app will automatically reload if you change any of the source files.

## Further help for CLI commands

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).


## Request main methods

Request Network Service:

```
  # method to create new request as Payer or Payee for different currencies
  createRequest(
    payerAddress: string, role: Types.Role, currency: Types.Currency,
    amount: number, requestOptions: Types.IRequestCreationOptions, callback?) 

  # method to get request instance by request id
  fromRequestId(
    requestId: string
  )

  # method to get request instance by generated transaction hash
  fromTransactionHash(
    txHash: string
  )

  @deprecated methods
  createRequestAsPayee()
  createRequestAsPayer()
```
