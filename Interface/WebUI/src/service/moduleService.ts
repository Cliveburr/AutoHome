import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ConfigService } from './configService';

import { BaseService } from './baseService';
import { ModuleModel } from '../model/moduleModel';

@Injectable()
export class ModuleService extends BaseService<ModuleModel> {

    constructor(http: Http, configService: ConfigService) {
        super('api/data/module', http, configService);
    }

    public get(): Promise<ModuleModel[]> {
        return super.get();
    }
}