import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AreaComponent } from './area.component';

const routes: Routes = [
  { path: '', component: AreaComponent }
];

@NgModule({
  imports: [ RouterModule.forChild(routes) ],
  declarations: [ AreaComponent ],
  exports: [ RouterModule ]
})
export default class AreaModule {

}