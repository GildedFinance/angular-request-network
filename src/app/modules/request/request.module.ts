import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestComponent } from './request.component';
import { BlockiesModule } from 'angular-blockies';
import { ToastrModule } from 'ngx-toastr';
import { RequestNetworkService } from '../../../lib/angular-request-network/services/request-network.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    BlockiesModule,
    ToastrModule.forRoot(), // ToastrModule added
  ],
  declarations: [
    RequestComponent
  ],
  exports: [
    RequestComponent
  ],
  providers: [
    RequestNetworkService
  ]
})
export class RequestModule { }
