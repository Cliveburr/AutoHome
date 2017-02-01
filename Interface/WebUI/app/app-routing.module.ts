import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadChildren: './app/view/home/home.module' },
  { path: 'area', loadChildren: './app/view/area/area.module' },
  { path: 'data', loadChildren: './app/view/data/data.module' },
  { path: 'editor', loadChildren: './app/view/editor/editor.module' }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  declarations: [ ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {

}