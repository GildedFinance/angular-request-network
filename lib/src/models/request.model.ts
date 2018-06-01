// stores request data
export class Request {
  creator: string;
  currencyContract: any;
  data: any;
  payee: any;
  payer: string; // hash address
  requestId: string;
  state: number;
  subPayees: any;
}

// stores transaction object : actually only hash key
export class Transaction {
  hash: string;
}

// stores request response
export class RequestResponse {
  request: Request;
  transaction: Transaction;
  message: any;
}

// stores response message
export class ResponseMessage {
  message: string;
  type: string;
}
