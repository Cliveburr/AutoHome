
export enum CellingFanMessageType {
    Unkown = 0,
    StateReadRequest = 1,
    StateReadResponse = 2,
    StateSaveRequest = 3,
    StateSaveResponse = 4,
    ConfigReadRequest = 5,
    ConfigReadResponse = 6,
    ConfigSaveRequest = 7
}

export enum FanSpeedEnum {
    Min = 0,
    Medium = 1,
    Max = 2,
    NotSet = 3
}

export interface StateSaveRequest {
    setLight?: boolean;
    light?: boolean;
    setFan?: boolean;
    fan?: boolean;
    setFanUp?: boolean;
    fanUp?: boolean;
    fanSpeed?: FanSpeedEnum;
}

export interface CellingFanState {
    light: boolean;
    fan: boolean;
    fanUp: boolean;
    fanSpeed: FanSpeedEnum;
}