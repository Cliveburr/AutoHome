
export enum StandardType {
    rbgLight,
    blackWhiteLight
}

export class StandardModel {
    public id: string;
    public name: string;
    public type: StandardType;
}