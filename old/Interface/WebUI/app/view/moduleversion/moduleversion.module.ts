import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SharedModule } from '../../main/shared.module';

import { ModuleVersionComponent } from './moduleversion.component';
import { ModuleVersionEditComponent } from './moduleversion-edit.component';

const routes: Routes = [
  { path: '', component: ModuleVersionComponent },
  { path: ':id', component: ModuleVersionEditComponent }
];

@NgModule({
  imports: [ CommonModule, RouterModule.forChild(routes), FormsModule, SharedModule ],
  declarations: [ ModuleVersionComponent, ModuleVersionEditComponent ],
  exports: [ RouterModule ],
  providers: [ ],
  entryComponents: [  ]
})
export default class ModuleVersionModule {

}