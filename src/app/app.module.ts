import { NgModule, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

// components
import { AppComponent } from './app.component';

// modules
import { RequestModule } from './modules/request/request.module';
import { MDBBootstrapModule } from 'angular-bootstrap-md';

@NgModule({
  schemas: [ NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA ],
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    MDBBootstrapModule.forRoot(),
    RequestModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
