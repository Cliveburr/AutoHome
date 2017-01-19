import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { BaseService } from './baseService';
import { ModuleModel } from '../model/moduleModel';

@Injectable()
export class ModuleService {

    constructor(
        private base: BaseService<ModuleModel>
    ) {
        base.path = 'api/data/module';
    }

    public get(): Promise<ModuleModel[]> {
        return this.base.get();
    }
}