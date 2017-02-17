import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule }    from '@angular/forms';

import { RgbLightModuleComponent } from './rgblight/rgblight-module.component';
import { RgbLightStandardComponent } from './rgblight/rgblight-standard.component';
import { ColorPickerModule } from 'angular2-color-picker';

import { StandardService } from '../../service/standardService';
import { ModuleService } from '../../service/moduleService';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'rgblight/standard/:id', component: RgbLightStandardComponent },
    { path: 'rgblight/module/:id', component: RgbLightModuleComponent }
];

@NgModule({
  imports: [ CommonModule, RouterModule.forChild(routes), NgbModule, FormsModule, ColorPickerModule ],
  declarations: [ RgbLightStandardComponent, RgbLightModuleComponent ],
  exports: [ RouterModule, ColorPickerModule ],
  providers: [ StandardService, ModuleService ]
})
export default class EditorModule {

}