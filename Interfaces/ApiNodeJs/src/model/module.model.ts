

export interface ModuleListRequest {
    fromTime: string;
}

export interface ModuleModel {
    UID: number;
    alias: string;
    moduleType: string;
    ip: string;
}

export interface BolleanRequest {
    model: ModuleModel;
    value: boolean;
}

export interface UintRequest {
    model: ModuleModel;
    value: number;
}

export interface UidRequest {
    uid: number;
}