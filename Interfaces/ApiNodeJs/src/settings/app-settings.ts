import * as fs from 'fs';
import * as path from 'path';
import { DefinedProvider, IProvider } from "providerjs"

export class AppSettings {
    public constructor(
        public apiPort: number,
        public timeout: number | undefined,
        public https: boolean,
        public allowedHosts: string,
        public allowOrigins: string,
        public securityKey: string,
        public userLogin: string,
        public adminLogin: string,
        public myUID: number,
        public sendPort: number,
        public receivePort: number,
        public wwwroot: string,

        public approot: string
    ) {
    }
}

export const loadAppSettings = (approot: string): { provider: IProvider, appSettings: AppSettings } => {
    const fullPath = path.join(approot, 'appsettings.json');
    const file = path.resolve(fullPath);
    const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
    obj.approot = approot;
    return { provider: new DefinedProvider(AppSettings, obj), appSettings: obj };
}
