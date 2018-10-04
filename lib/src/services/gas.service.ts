import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { retry, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GasService {
  constructor(private http: HttpClient) {}

  // public gasStationEndpoint = 'https://ethgasstation.info/json/ethgasAPI.json';
  public etherchainGasOracleEndpoint = 'https://www.etherchain.org/api/gasPriceOracle';
  public gasPrice = 15; // In gwei

  public getGasPrices(): Observable<any> {
    return this.http
      .get<EtherchainGasResponse>(this.etherchainGasOracleEndpoint)
      .pipe(
        retry(3),
        shareReplay()
      );
  }
}

export interface EtherchainGasResponse {
  safeLow: number;
  standard: number;
  fast: number;
  fastest: number;
}
