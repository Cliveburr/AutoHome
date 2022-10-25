
export interface HomeImageDescription {
    GlobalMargin: number;
    Areas: HomeImageDescriptionArea[];
}

export interface HomeImageDescriptionArea {
    UID: number;
    Name?: string;
    Image?: string;
    Red: number;
    Blue: number;
    Green: number;
    PointX: number;
    PointY: number;
    Width: number;
    Height: number;
}