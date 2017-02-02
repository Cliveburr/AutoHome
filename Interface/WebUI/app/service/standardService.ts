import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ConfigService } from './configService';

import { BaseService } from './baseService';
import { StandardModel, StandardListModel, StandardType } from '../model/standardModel';

@Injectable()
export class StandardService extends BaseService<StandardModel> {

    constructor(
        http: Http,
        configService: ConfigService
    ) {
        super(http, configService)
        this.path = 'standard';
    }

    public get(): Promise<StandardModel[]> {
        return this.get();
    }

    public getByID(id: string): Promise<StandardModel> {
        return this.getUrl(id);
    }

    public getListByType(type: StandardType): Promise<StandardListModel[]> {
        return this.getUrl('listByType/' + type.toString());
    }

    public discovery(): void {
        this.ugetUrl('broadcastinforequest');
    }

    public create(standard: StandardModel): Promise<null> {
        return this.put(standard);
    }

    public update(standard: StandardModel): Promise<null> {
        return this.post(standard);
    }

    public updateValue(standard: StandardModel): Promise<null> {
        return this.post(standard, 'value');
    }

    public delete(id: string): Promise<StandardModel> {
        return this.delete(id);
    }    
}