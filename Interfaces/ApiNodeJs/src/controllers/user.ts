import { Controller, HttpPost } from "webhost-mvc";
var jwt = require('jsonwebtoken');
import { LoginRequest, LoginResponse } from "../model";
import { JwtService } from "../security/jwt-security";
import { AppSettings } from "../settings/app-settings";
import { ControllerBase } from "./controller-base";

@Controller()
export default class UserController extends ControllerBase {

    public constructor(
        private authenticationService: JwtService,
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

        var token = this.authenticationService.generateToken({
            id: request.uniqueId,
            isAdmin
        });

        return {
            token,
            isAdmin
        };
    }
}