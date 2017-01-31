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

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }

    public get(): Promise<T[]> {
        return this.http
            .get(this.basePath)
            .toPromise()
            .then(response => response.json() as T[])
            .catch(this.handleError);
    }
    
    public getUrl<T>(url: string): Promise<T> {
        return this.http
            .get(this.basePath + '/' + url)
            .toPromise()
            .then(response => response.json() as T)
            .catch(this.handleError);
    }

    public ugetUrl(url: string): Promise<null> {
        return this.http
            .get(this.basePath + '/' + url)
            .toPromise()
            .catch(this.handleError);
    }

    public post(url: string, model: T): Promise<null> {
        return this.http
            .post(this.basePath + '/' + url, model)
            .toPromise()
            .catch(this.handleError);
    }
}