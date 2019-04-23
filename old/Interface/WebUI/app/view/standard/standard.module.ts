import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SharedModule } from '../../main/shared.module';
import { StandardComponent } from './standard.component';
import { StandardEditComponent } from './standard-edit.component';

const routes: Routes = [
  { path: '', component: StandardComponent },
  { path: ':id', component: StandardEditComponent }
];

@NgModule({
  imports: [ CommonModule, RouterModule.forChild(routes), FormsModule, SharedModule ],
  declarations: [ StandardComponent, StandardEditComponent ],
  exports: [ RouterModule ],
  providers: [ ]
})
export default class StandardModule {

}