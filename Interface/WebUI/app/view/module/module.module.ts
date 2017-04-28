import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BsDropdownModule } from 'ng2-bootstrap';
import { SharedModule } from '../../main/shared.module';

import { ModuleComponent } from './module.component';
import { ModuleEditComponent } from './module-edit.component';
import { ModuleDiscoveryComponent } from './module-discovery.component';


const routes: Routes = [
  { path: '', component: ModuleComponent },
  { path: 'discovery', component: ModuleDiscoveryComponent },
  { path: ':id', component: ModuleEditComponent }
];

@NgModule({
  imports: [ CommonModule, RouterModule.forChild(routes), FormsModule, BsDropdownModule, SharedModule ],
  declarations: [ ModuleComponent, ModuleEditComponent, ModuleDiscoveryComponent ],
  exports: [ RouterModule ],
  providers: [ ]
})
export default class ModuleModule {

}