import { NgModule, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

// components
import { AppComponent } from './app.component';

// modules
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RequestNetworkModule, RequestNetworkService } from 'angular-request-network';
import { RequestModule } from './modules/request/request.module';

@NgModule({
  schemas: [ NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA ],
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MDBBootstrapModule.forRoot(),
    RequestNetworkModule.forRoot(),
    RequestModule
  ],
  providers: [ RequestNetworkService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
