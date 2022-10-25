import { Controller, HttpPost } from "webhost-mvc";
var jwt = require('jsonwebtoken');
import { LoginRequest, LoginResponse } from "../model";
import { AppSettings } from "../settings/app-settings";
import { ControllerBase } from "./controller-base";

@Controller()
export default class UserController extends ControllerBase {

    public constructor(
        private appSettings: AppSettings
    ) {
        super();
    }

    @HttpPost('/login/')
    public homeGet(request: LoginRequest): LoginResponse {

        if (!(request.password == this.appSettings.userLogin || request.password == this.appSettings.adminLogin))
        {
            return super.badRequest();
        }

        var isAdmin = request.password == this.appSettings.adminLogin;

        var token = this.generateToken(request.uniqueId, isAdmin);

        return {
            token,
            isAdmin
        };
    }

    private generateToken(uniqueId: string, isAdmin: boolean): string {
        
        const claim = {
            id: uniqueId,
            isAdmin
        }

        const token = jwt.sign(claim, this.appSettings.securityKey, { algorithm: 'HS256'});

        return token;
    }
}