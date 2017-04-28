import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { TabsModule } from 'ng2-bootstrap';

import { RgbLightModuleComponent } from './rgblight/rgblight-module.component';
import { RgbLightStandardComponent } from './rgblight/rgblight-standard.component';
import { ColorPickerModule } from 'angular2-color-picker';

import { SharedModule } from '../../main/shared.module';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'rgblight/standard/:id', component: RgbLightStandardComponent },
    { path: 'rgblight/module/:id', component: RgbLightModuleComponent }
];

@NgModule({
  imports: [ CommonModule, RouterModule.forChild(routes), FormsModule, ColorPickerModule, SharedModule, TabsModule ],
  declarations: [ RgbLightStandardComponent, RgbLightModuleComponent ],
  exports: [ RouterModule ],
  providers: [ ]
})
export default class EditorModule {

}