import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ConfigService } from './configService';

import { BaseService } from './baseService';
import { IndexViewModel, EditViewModel, EditorViewModel, ModuleType } from '../model/moduleModel';
import { StandardType } from '../model/standardModel';

@Injectable()
export class ModuleService extends BaseService {

    constructor(
        http: Http,
        configService: ConfigService
    ) {
        super(http, configService);
        super.path = 'module';
    }

    public getIndex(): Promise<IndexViewModel> {
        return super.get();
    }

    public discovery(): Promise<null> {
        return this.ugetUrl('broadcastinforequest');
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

    public getEditor(id: string): Promise<EditorViewModel> {
        return super.getUrl('editor/' + id);
    }

    public postEditor(model: EditorViewModel): Promise<null> {
        return super.post(model, 'editor');
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