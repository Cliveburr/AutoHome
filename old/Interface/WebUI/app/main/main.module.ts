import './rxjs-extensions';
import { NgModule } from '@angular/core';
import { BrowserModule }  from '@angular/platform-browser';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';

import { BsDropdownModule, TabsModule, ModalModule, AlertModule } from 'ng2-bootstrap';
import { NAV_DROPDOWN_DIRECTIVES } from '../directive/nav-dropdown.directive';
import { SIDEBAR_TOGGLE_DIRECTIVES } from '../directive/sidebar.directive';
import { AsideToggleDirective } from '../directive/aside.directive';

import { MainRoutingModule } from './main.routing';
import { MainComponent } from './main.component';
import { MainLayoutComponent } from '../view/shared/main-layout.component';
import { DashboardComponent } from '../view/dashboard/dashboard.component';
import { SharedModule } from './shared.module';

import { ConfigService } from '../service/configService';

@NgModule({
  imports: [ BrowserModule, MainRoutingModule, BsDropdownModule.forRoot(), TabsModule.forRoot(), ModalModule.forRoot(), AlertModule.forRoot(),
    HttpModule, SharedModule ],
  declarations: [ MainComponent, MainLayoutComponent, NAV_DROPDOWN_DIRECTIVES, SIDEBAR_TOGGLE_DIRECTIVES,
    AsideToggleDirective, DashboardComponent ],
  bootstrap: [ MainComponent ],
  providers: [ { provide: LocationStrategy, useClass: PathLocationStrategy }, ConfigService ],
})
export class MainModule {
  public constructor(
    private configService: ConfigService
  ) {
  }
}