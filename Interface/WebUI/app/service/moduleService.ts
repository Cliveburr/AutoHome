import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ConfigService } from './configService';

import { BaseService } from './baseService';
import { ModuleModel, ModuleType } from '../model/moduleModel';
import { StandardType } from '../model/standardModel';

@Injectable()
export class ModuleService extends BaseService<ModuleModel> {

    constructor(
        http: Http,
        configService: ConfigService
    ) {
        super(http, configService);
        super.path = 'module';
    }

    public get(): Promise<ModuleModel[]> {
        return this.get();
    }

    public getByID(id: string): Promise<ModuleModel> {
        return this.getUrl(id);
    }

    public getByUID(uid: number): Promise<ModuleModel> {
        return this.getUrl('uid/' + uid.toString());
    }

    public discovery(): void {
        this.ugetUrl('broadcastinforequest');
    }

    public update(module: ModuleModel): Promise<null> {
        return this.post(module, module.uid.toString());
    }

    public updateState(module: ModuleModel): Promise<null> {
        return this.post(module, module.uid.toString());
    }

    public delete(id: string): Promise<ModuleModel> {
        return this.delete(id);
    }

    public getStandardType(type: ModuleType): StandardType {
        switch (type) {
            case ModuleType.ledRibbonRgb:
                return StandardType.rgbLight;
            case ModuleType.incandescentLamp:
                return StandardType.blackWhiteLight;
        }
    }
}