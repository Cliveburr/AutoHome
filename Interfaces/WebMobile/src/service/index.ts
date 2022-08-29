

export * from './api.service';
export * from './initialize.service';
export * from './logged-guard.service';
export * from './session.service';
export * from './store.service';
export * from './user.service';

import { ApiService } from './api.service';
import { LoggedGuardService } from './logged-guard.service';
import { SessionService } from './session.service';
import { StoreService } from './store.service';
import { UserService } from './user.service';
export const ALL_SERVICE = [
    ApiService,
    LoggedGuardService,
    SessionService,
    StoreService,
    UserService,
    
]