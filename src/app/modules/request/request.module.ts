import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestComponent } from './request.component';
import { BlockiesModule } from 'angular-blockies';
import { ToastrModule } from 'ngx-toastr';

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
  ]
})
export class RequestModule { }
