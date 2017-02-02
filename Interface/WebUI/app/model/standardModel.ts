import { RgbLightModel } from './rgbLightModel';

export enum StandardType {
    rgbLight,
    blackWhiteLight
}

export class StandardModel {
    public id: string;
    public name: string;
    public type: StandardType;
    public value: RgbLightModel;
}

export class StandardListModel {
    public standardId: string;
    public name: string;
}