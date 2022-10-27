
export enum ModuleType {
    Invalid = 0,
    Simulation = 1,
    LedRibbonRgb = 2,
    TempHumiSensor = 3,
    IncandescentLamp = 4,
    CellingFan = 5
}

export enum PortType {
    Unkown = 0,
    AutoHome = 1,
    Fota = 2,
    RGBLedRibbon = 3,
    TempHumiSensor = 4,
    CellingFan = 5
}

export enum AutoHomeMessageType {
    Unkown = 0,
    PingRequest = 1,
    PongResponse = 2,
    ConfigurationReadRequest = 3,
    ConfigurationReadResponse = 4,
    ConfigurationSaveRequest = 5,
    UIDSaveRequest = 6
}

export interface MessageHeader {
    fromUID: number;
    toUID: number;
    port: PortType;
    msg: number;
}

export interface DiscoveryModuleModel {
    UID: number;
    alias: string;
    moduleType: ModuleType;
    address: string;
    onTime: number;
}