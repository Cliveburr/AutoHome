import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule }    from '@angular/forms';

import { RgbLightComponent } from './rgblight/rgblight.component';
import { ColorPickerComponent } from '../../component/colorPicker';

import { BaseService } from '../../service/baseService';
import { StandardService } from '../../service/standardService';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'rgblight/:type/:id', component: RgbLightComponent }
];

@NgModule({
  imports: [ CommonModule, RouterModule.forChild(routes), NgbModule, FormsModule ],
  declarations: [ RgbLightComponent, ColorPickerComponent ],
  exports: [ RouterModule ],
  providers: [ BaseService, StandardService ]
})
export default class EditorModule {

}