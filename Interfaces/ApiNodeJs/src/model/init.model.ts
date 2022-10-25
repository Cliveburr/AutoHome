
export interface InitRequest {
    cacheDate?: number;
}

export interface InitResponse {
    cacheDate: number;
    fullImage: Uint8Array;
    globalMargin: number;
    areas: InitResponseArea[];
}

export interface InitResponseArea {
    UID: number;
    name?: string;
    image?: string;
    x: number;
    y: number;
    width: number;
    height: number;
}