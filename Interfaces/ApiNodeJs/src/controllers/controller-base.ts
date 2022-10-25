import { HttpError } from "webhost-mvc";

export abstract class ControllerBase {

    protected badRequest(msg?: string): any {
        return new HttpError(400, msg)
    }
}