import { HomeImageDescription } from "./homeImageDescription";

export interface InitRequest {
    cacheDate?: string | number;
}

export interface InitResponse {
    cacheDate: number;
    fullImage: string;
    description: HomeImageDescription;
}