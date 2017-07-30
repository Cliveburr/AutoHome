import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ConfigService } from './configService';

import { BaseService } from './baseService';
import { ModuleType } from '../model/moduleModel';
import { IndexViewModel, IndexModule, EditViewModel } from '../model/moduleversion.model';

@Injectable()
export class ModuleVersionService extends BaseService {

    constructor(
        http: Http,
        configService: ConfigService
    ) {
        super(http, configService);
        this.path = 'moduleversion';
    }

    public getIndex(): Promise<IndexViewModel> {
        return super.get();
    }

    public delete(id: string): Promise<null> {
        return super.delete(id);
    }

    public getEdit(id: string): Promise<EditViewModel> {
        return super.getUrl('edit/' + id);
    }

    public postEdit(model: EditViewModel): Promise<null> {
        return super.post(model, 'edit');
    }

    public getFilter(type: ModuleType): Promise<IndexModule[]> {
        return super.getUrl('filter/' + type);
    }

    public postFOTAUpgrade(moduleIds: string[], moduleVersionId: string): Promise<null> {
        return super.post(moduleIds, 'fotaupgrade/' + moduleVersionId);
    }
}