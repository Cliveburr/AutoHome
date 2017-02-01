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