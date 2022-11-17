

export * from './api.service';
export * from './initialize.service';
export * from './logged-guard.service';
export * from './session.service';
export * from './store.service';
export * from './user.service';
export * from './modules/module.service';
export * from './modules/cellingFan.service';
export * from './base.service';
export * from './home.service';
export * from './with-module-guard.service';

import { ApiService } from './api.service';
import { LoggedGuardService, NotLoggedGuardService } from './logged-guard.service';
import { SessionService } from './session.service';
import { StoreService } from './store.service';
import { UserService } from './user.service';
import { ModuleService } from './modules/module.service';
import { CellingFanService } from './modules/cellingFan.service';
import { BaseService } from './base.service';
import { HomeService } from './home.service';
import { WithModuleGuardService } from './with-module-guard.service';
export const ALL_SERVICE = [
    ApiService,
    LoggedGuardService, NotLoggedGuardService,
    SessionService,
    StoreService,
    UserService,
    ModuleService,
    CellingFanService,
    BaseService,
    HomeService,
    WithModuleGuardService
]