
export enum ModuleType {
    ribbonLedRgb,
    incandescentLamp
}

export class ModuleModel {
    public moduleId: number;
    public alias: string;
    public type: ModuleType;
}