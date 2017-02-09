import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ConfigService } from './configService';

import { BaseService } from './baseService';
import { IndexViewModel, EditViewModel } from '../model/areaModel';

@Injectable()
export class AreaService extends BaseService {

    constructor(
        http: Http,
        configService: ConfigService
    ) {
        super(http, configService)
        this.path = 'area';
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
}