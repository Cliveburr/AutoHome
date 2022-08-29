import { Injectable } from '@angular/core';

@Injectable()
export class StoreService {

    public read<T>(key: string): T | undefined {
        const resultString = window.localStorage.getItem(key);
        if (resultString)
            return JSON.parse(resultString) as T;
        else
            return undefined;
    }

    public save(key: string, data: any): void {
        window.localStorage.setItem(key, JSON.stringify(data));
    }

    public delete(key: string): void {
        window.localStorage.removeItem(key);
    }
}
