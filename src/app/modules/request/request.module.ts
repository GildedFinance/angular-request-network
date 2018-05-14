import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestComponent } from './request.component';
import { Web3Service } from '../../util/web3.service';
import { BlockiesModule } from 'angular-blockies';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    BlockiesModule
  ],
  declarations: [
    RequestComponent
  ],
  exports: [
    RequestComponent
  ],
  providers: [
    Web3Service
  ]
})
export class RequestModule { }
