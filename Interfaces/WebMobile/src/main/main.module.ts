import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';

import { MainRoutingModule } from './main.routing';
import { ALL_VIEWS, MainLayoutComponent } from '../view';
import { ALL_INITIALIZERS, ALL_SERVICE } from '../service';

@NgModule({
    declarations: [
        ALL_VIEWS
    ],
    imports: [
        BrowserModule, IonicModule.forRoot(), MainRoutingModule,
        CommonModule, FormsModule, HttpClientModule
    ],
    providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        ALL_INITIALIZERS, ALL_SERVICE
    ],
    bootstrap: [
        MainLayoutComponent
    ]
})
export class MainModule {
}
