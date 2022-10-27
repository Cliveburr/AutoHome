export * from './connection.service';
export * from './autohome.service';
export * from './cellingfan.service';

import { ConnectionService } from './connection.service';
import { AutoHomeService } from './autohome.service';
import { CellingFanService } from './cellingfan.service';
export const ALL_SERVICES = [
    ConnectionService,
    AutoHomeService,
    CellingFanService
]