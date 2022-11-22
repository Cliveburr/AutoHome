
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