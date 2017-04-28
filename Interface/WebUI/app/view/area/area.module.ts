import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Ng2DragDropModule } from 'ng2-drag-drop';

import { AreaComponent } from './area.component';
import { AreaEditComponent } from './area-edit.component';

const routes: Routes = [
  { path: '', component: AreaComponent },
  { path: ':id', component: AreaEditComponent }
];

@NgModule({
  imports: [ CommonModule, RouterModule.forChild(routes), FormsModule, Ng2DragDropModule ],
  declarations: [ AreaComponent, AreaEditComponent ],
  exports: [ RouterModule ],
  providers: [ ]
})
export default class AreaModule {

}