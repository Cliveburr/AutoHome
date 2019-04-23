import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

export interface EnvironmentConfig {
    apiUrl: string;
}

@Injectable()
export class ConfigService {
    private envConfigData: EnvironmentConfig;

    public constructor(
        private http: Http
    ) {
        this.loadEnvConfig();
    }

    public loadEnvConfig(): void {
        this.http.get('./env.config.json')
            .toPromise()
            .then(res =>
                        this.envConfigData = res.json() as EnvironmentConfig)
            .catch(err => Promise.reject(err));
    }

    public get envConfig(): EnvironmentConfig {
        return this.envConfigData;
    }
}