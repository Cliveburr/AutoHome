import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ConfigService } from './configService';

import { BaseService } from './baseService';
import { StandardModel, StandardListModel, StandardType } from '../model/standardModel';

@Injectable()
export class StandardService extends BaseService {

    constructor(
        http: Http,
        configService: ConfigService
    ) {
        super(http, configService)
        this.path = 'standard';
    }

    public get(): Promise<StandardModel[]> {
        return super.get();
    }

    public getByID(id: string): Promise<StandardModel> {
        return super.getUrl(id);
    }

    public getListByType(type: StandardType): Promise<StandardListModel[]> {
        return super.getUrl('listByType/' + type.toString());
    }

    public discovery(): void {
        super.ugetUrl('broadcastinforequest');
    }

    public create(standard: StandardModel): Promise<null> {
        return super.put(standard);
    }

    public update(standard: StandardModel): Promise<null> {
        return super.post(standard);
    }

    public updateValue(standard: StandardModel): Promise<null> {
        return super.post(standard, 'value');
    }

    public delete(id: string): Promise<StandardModel> {
        return super.delete(id);
    }    
}