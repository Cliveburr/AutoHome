import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule }    from '@angular/forms';

import { AreaComponent } from './area.component';
import { AreaService } from '../../service/areaService';

const routes: Routes = [
  { path: '', component: AreaComponent }
];

@NgModule({
  imports: [ CommonModule, RouterModule.forChild(routes), NgbModule, FormsModule ],
  declarations: [ AreaComponent ],
  exports: [ ],
  providers: [ AreaService ]
})
export default class AreaModule {

}