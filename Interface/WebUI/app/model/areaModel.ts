import { ModuleType } from './moduleModel';

export class IndexViewModel {
    public list: IndexArea[];
}

export class IndexArea {
    public areaId: string;
    public name: string;
    public moduleCount: number;
}

export class EditViewModel {
    public areaId: string;
    public name: string;
    public belong: EditModule[];
    public avaliable: EditModule[];
}

export class EditModule {
    public moduleId: string;
    public alias: string;
}

export class AreaViewModel {
    public list: AreaItem[];
}

export class AreaItem {
    public name: string;
    public modules: ModuleItem[];
}

export class ModuleItem {
    public moduleId: string;
    public alias: string;
    public type: ModuleType;
}