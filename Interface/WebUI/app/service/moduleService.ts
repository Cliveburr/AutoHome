import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { BaseService } from './baseService';
import { ModuleModel } from '../model/moduleModel';

@Injectable()
export class ModuleService {

    constructor(
        private base: BaseService<ModuleModel>
    ) {
        base.path = 'api/module';
    }

    public get(): Promise<ModuleModel[]> {
        return this.base.get();
    }

    public getByUID(uid: number): Promise<ModuleModel> {
        return this.base.getUrl(uid.toString());
    }

    public discovery(): void {
        this.base.ugetUrl('broadcastinforequest');
    }

    public update(module: ModuleModel): Promise<null> {
        return this.base.post(module.uid.toString(), module);
    }
}