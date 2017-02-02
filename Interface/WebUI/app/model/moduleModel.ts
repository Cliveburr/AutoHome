import { RgbLightModel } from './rgbLightModel';

export enum ModuleType {
    ledRibbonRgb = 1,
    incandescentLamp = 2
}

export class ModuleModel {
    public id: string;
    public uid: number;
    public alias: string;
    public type: ModuleType;
    public ledRibbonRgbState: ModuleStateModel;
}

export class ModuleStateModel {
    public isStandard: boolean;
    public standardId: string;
    public value: RgbLightModel;
}