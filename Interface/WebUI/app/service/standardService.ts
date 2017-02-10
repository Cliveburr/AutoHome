import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ConfigService } from './configService';

import { BaseService } from './baseService';
import { IndexViewModel, EditViewModel, EditorViewModel } from '../model/standardModel';

@Injectable()
export class StandardService extends BaseService {

    constructor(
        http: Http,
        configService: ConfigService
    ) {
        super(http, configService)
        this.path = 'standard';
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

    public getEditor(id: string): Promise<EditorViewModel> {
        return super.getUrl('editor/' + id);
    }

    public postEditor(model: EditorViewModel): Promise<null> {
        return super.post(model, 'editor');
    }
}