
export * from './shared/mainlayout.component';
export * from './user/login.component';
export * from './tabs/tabs.component';
export * from './home/home.component';
export * from './discovery/discovery.component';

import { MainLayoutComponent } from './shared/mainlayout.component';
import { UserLoginComponent } from './user/login.component';
import { TabsComponent } from './tabs/tabs.component';
import { HomeComponent } from './home/home.component';
import { DiscoveryComponent } from './discovery/discovery.component';
export const ALL_VIEWS = [
    MainLayoutComponent,
    UserLoginComponent,
    TabsComponent,
    HomeComponent,
    DiscoveryComponent
]