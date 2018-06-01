import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestNetworkService } from './services/request-network.service';

@NgModule({
  imports: [
    CommonModule,
  ],
  providers: [
    RequestNetworkService
  ]
})
export class RequestNetworkModule {

  public static forRoot(): ModuleWithProviders {

    return {
      ngModule: RequestNetworkModule,
      providers: [
        RequestNetworkService
      ]
    };
  }
}
