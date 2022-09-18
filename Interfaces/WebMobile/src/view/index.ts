
export * from './shared/mainlayout.component';
export * from './user/login.component';
export * from './options/options.component';
export * from './home/home.component';
export * from './discovery/discovery.component';
export * from './modules/cellingFan/cellingFan-module.component';

import { MainLayoutComponent } from './shared/mainlayout.component';
import { UserLoginComponent } from './user/login.component';
import { OptionsComponent } from './options/options.component';
import { HomeComponent } from './home/home.component';
import { DiscoveryComponent } from './discovery/discovery.component';
import { CellingFanModuleComponent } from './modules/cellingFan/cellingFan-module.component';
export const ALL_VIEWS = [
    MainLayoutComponent,
    UserLoginComponent,
    OptionsComponent,
    HomeComponent,
    DiscoveryComponent,
    CellingFanModuleComponent
]