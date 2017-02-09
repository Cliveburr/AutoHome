import 'rxjs/add/operator/toPromise';
import { Http } from '@angular/http';
import { ConfigService } from './configService';

export abstract class BaseService {

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

    protected get(): Promise<any> {
        return this.http
            .get(this.basePath)
            .toPromise()
            .then(response => response.json())
            .catch(this.handleError);
    }
    
    protected getUrl(url: string): Promise<any> {
        return this.http
            .get(this.basePath + '/' + url)
            .toPromise()
            .then(response => response.json())
            .catch(this.handleError);
    }

    protected ugetUrl(url: string): Promise<null> {
        return this.http
            .get(this.basePath + '/' + url)
            .toPromise()
            .catch(this.handleError);
    }

    protected post(model: any, url?: string): Promise<null> {
        let wurl = url ?
            this.basePath + '/' + url :
            this.basePath;

        return this.http
            .post(wurl, model)
            .toPromise()
            .catch(this.handleError);
    }

    protected put<T>(model: T): Promise<null> {
        return this.http
            .put(this.basePath, model)
            .toPromise()
            .catch(this.handleError);
    }

    protected delete(url: string): Promise<null> {
        return this.http
            .delete(this.basePath + '/' + url)
            .toPromise()
            .catch(this.handleError);
    }
}