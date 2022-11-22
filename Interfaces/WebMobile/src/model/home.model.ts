
export interface InitRequest {
    cacheDate: number;
}

export interface InitResponse {
    cacheDate: number;
    fullImage: string;
    description: HomeImageDescription;
}

export interface HomeImageDescription {
    globalMargin: number;
    childs: HomeImageDescriptionArea[];
}

export interface HomeImageDescriptionArea {
    UID: number;
    image?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    childs: HomeImageDescriptionArea[];
}