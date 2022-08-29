import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { LoggedGuardService } from '../service';
import * as view from '../view';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'login', component: view.UserLoginComponent },
    { path: '', component: view.TabsComponent, canActivateChild: [LoggedGuardService], children: [
        { path: 'home', component: view.HomeComponent },
        { path: 'discovery', component: view.DiscoveryComponent }
    ] },
    { path: '**', redirectTo: '/home' }
]

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, enableTracing: false })
    ]
})
export class MainRoutingModule {
}
