import { RgbLightModel } from './rgbLightModel';
import { StandardListModel } from './standardModel';

export enum ModuleType {
    ledRibbonRgb = 1,
    incandescentLamp = 2
}

export class ModuleStateModel {
    public isStandard: boolean;
    public standardId: string;
    public value: RgbLightModel;
}

export class IndexViewModel
{
    public list: IndexModule[];
}

export class IndexModule
{
    public sel: boolean;
    public moduleId: string;
    public UID: number;
    public alias: string;
    public type: ModuleType;
    public areaBelong: string;
}

export class EditViewModel
{
    public moduleId: string;
    public UID: number;
    public alias: string;
}

export class EditorViewModel
{
    public moduleId: string;
    public alias: string;
    public type: ModuleType;
    public standardList: StandardListModel[];
    public ledRibbonRgbState: ModuleStateModel;
}

export class ConfigurationViewModel
{
    public UID: number;
    public alias: string;
    public type: ModuleType;
    public version: string;
    public wifiname: string;
    public wifipass: string;
}

export interface WifiConfigurationModel {
    wifiname: string;
    wifipass: string;
}