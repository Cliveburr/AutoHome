import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { LoggedGuardService, NotLoggedGuardService, WithModuleGuardService } from '../service';
import * as view from '../view';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'login', canActivate: [NotLoggedGuardService], component: view.UserLoginComponent },
    { path: '', canActivateChild: [LoggedGuardService], children: [
        { path: 'home', component: view.HomeComponent },
        { path: 'discovery', component: view.DiscoveryComponent },
        { path: 'options', component: view.OptionsComponent }
    ] },
    { path: 'cellingfan', canActivateChild: [WithModuleGuardService], children: [
        { path: '', component: view.CellingFanModuleComponent }
    ] },
    { path: '**', redirectTo: '/home' }
]

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, enableTracing: false })
    ],
    exports: [
        RouterModule
    ]
})
export class MainRoutingModule {
}
