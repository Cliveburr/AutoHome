import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainLayoutComponent } from '../view/shared/main-layout.component';
import { DashboardComponent } from '../view/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '',
    component: MainLayoutComponent,
    data: { title: 'Home' },
    children: [
      { path: 'home', loadChildren: './app/view/home/home.module' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'module', loadChildren: './app/view/module/module.module' },
      { path: 'area', loadChildren: './app/view/area/area.module' },
      { path: 'standard', loadChildren: './app/view/standard/standard.module' },
      { path: 'editor', loadChildren: './app/view/editor/editor.module' },
      { path: 'moduleversion', loadChildren: './app/view/moduleversion/moduleversion.module' }
    ]
  }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class MainRoutingModule {
}