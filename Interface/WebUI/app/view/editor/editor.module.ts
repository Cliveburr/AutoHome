import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule }    from '@angular/forms';

import { RgbLightComponent } from './rgblight/rgblight.component';
import { ColorPickerModule } from 'angular2-color-picker';

import { StandardService } from '../../service/standardService';
import { ModuleService } from '../../service/moduleService';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'rgblight/:type/:id', component: RgbLightComponent }
];

@NgModule({
  imports: [ CommonModule, RouterModule.forChild(routes), NgbModule, FormsModule, ColorPickerModule ],
  declarations: [ RgbLightComponent ],
  exports: [ RouterModule ],
  providers: [ StandardService, ModuleService ]
})
export default class EditorModule {

}