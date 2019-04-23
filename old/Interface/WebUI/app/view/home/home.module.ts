import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

import { TabsModule } from 'ng2-bootstrap';

import { HomeComponent } from './home.component';

const routes: Routes = [
  { path: '', component: HomeComponent }
];

@NgModule({
  imports: [ CommonModule, RouterModule.forChild(routes), TabsModule ],
  declarations: [ HomeComponent ],
  exports: [ RouterModule ]
})
export default class HomeModule {

}