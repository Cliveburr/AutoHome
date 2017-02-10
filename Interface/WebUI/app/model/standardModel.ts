import { RgbLightModel } from './rgbLightModel';

export enum StandardType {
    rgbLight,
    blackWhiteLight
}

export class StandardListModel {
    public standardId: string;
    public name: string;
}

export class IndexViewModel {
    public list: IndexStandard[];
}

export class IndexStandard {
    public standardId: string;
    public name: string;
    public type: StandardType;
    public moduleCount: number;
}

export class EditViewModel {
    public standardId: string;
    public name: string;
    public type: StandardType;
}

export class EditorViewModel {
    public standardId: string;
    public name: string;
    public type: StandardType;
    public rgbLightValue: RgbLightModel;
}