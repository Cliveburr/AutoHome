
export interface ModuleListRequest {
    fromTime: Date;
}

export interface ModuleModel {
    UID: string;
    alias: string;
    moduleType: string;
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
    uid: string;
}