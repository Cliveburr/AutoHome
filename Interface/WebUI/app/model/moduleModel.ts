
export enum ModuleType {
    ribbonLedRgb,
    incandescentLamp
}

export class ModuleModel {
    public id: string;
    public uid: number;
    public alias: string;
    public type: ModuleType;
}