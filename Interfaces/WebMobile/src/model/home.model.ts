
export interface InitRequest {
    cacheDate: number;
}

export interface InitResponse {
    cacheDate: number;
    fullImage: string;
    globalMargin: number;
    areas: InitResponseArea[];
}

export interface InitResponseArea {
    uid: number;
    name: string;
    image: string;
    x: number;
    y: number;
    width: number;
    height: number;
}