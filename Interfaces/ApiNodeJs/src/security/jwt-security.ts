import { Injectable } from "providerjs";
import { IContext } from "webhost";
import { AuthenticationService, Identity } from "webhost-mvc";
import { AppSettings } from "../settings/app-settings";
var jwt = require('jsonwebtoken');

export interface Claims {
    id: string;
    isAdmin: boolean;
}

export class AutoHomeIdentity extends Identity {
    public constructor(
        public id: string,
        public isAdmin: boolean
    ) {
        super();
    }
}

@Injectable()
export class JwtService extends AuthenticationService {

    private JWT_HEADER = 'authorization';

    public constructor(
        private appSettings: AppSettings
    ) {
        super();
    }

    public async authenticate(ctx: IContext): Promise<Identity | undefined> {
        const headers = ctx.request.headers;
        if (this.JWT_HEADER in headers) {
            const beareToken = <string>headers[this.JWT_HEADER];
            if (beareToken) {
                const token = beareToken.substring(7);
                const claims = <Claims>jwt.verify(token, this.appSettings.securityKey, { algorithm: 'HS256'});
                return new AutoHomeIdentity(claims.id, claims.isAdmin);
            }
        }
        return undefined;
    }

    public generateToken(claims: Claims): string {
        return jwt.sign(claims, this.appSettings.securityKey, { algorithm: 'HS256'});
    }
}
export const JwtServiceProvider = AuthenticationService.providerFor(JwtService);