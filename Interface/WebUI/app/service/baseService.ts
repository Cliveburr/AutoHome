import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { ConfigService } from './configService';

@Injectable()
export class BaseService<T> {

    public path: string;

    public constructor(
        private http: Http,
        private configService: ConfigService
    ) {
    }

    protected get basePath(): string {
        return `${this.configService.envConfig.apiUrl}${this.path}`
    }

    public get(): Promise<T[]> {
        // return this.http
        //     .get(this.basePath)
        //     .toPromise()
        //     .then(response => response.json().data as T[])
        //     .catch(this.handleError);

        console.log(this.http, this.configService);

                return new Promise((e, r) => {
            e([ 
                { 'moduleId': 1, 'alias': 'vai2', 'type': 3 },
                { 'moduleId': 1, 'alias': 'vai2', 'type': 3 },
                { 'moduleId': 1, 'alias': 'vai2', 'type': 3 },
                { 'moduleId': 1, 'alias': 'vai2', 'type': 3 }
            ]);
        })
    }

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}