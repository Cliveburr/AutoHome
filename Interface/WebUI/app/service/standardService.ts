import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { BaseService } from './baseService';
import { StandardModel } from '../model/standardModel';

@Injectable()
export class StandardService {

    constructor(
        private base: BaseService<StandardModel>
    ) {
        base.path = 'standard';
    }

    public get(): Promise<StandardModel[]> {
        return this.base.get();
    }

    public getByID(id: string): Promise<StandardModel> {
        return this.base.getUrl(id);
    }

    public discovery(): void {
        this.base.ugetUrl('broadcastinforequest');
    }

    public create(standard: StandardModel): Promise<null> {
        return this.base.put(standard);
    }

    public update(standard: StandardModel): Promise<null> {
        return this.base.post(standard);
    }

    public delete(id: string): Promise<StandardModel> {
        return this.base.delete(id);
    }    
}