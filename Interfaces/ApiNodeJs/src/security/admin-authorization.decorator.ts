import { IAuthorizationEvent } from "webhost-mvc";
import { AutoHomeIdentity } from "./jwt-security";

const checkIsAdmin = (identity: AutoHomeIdentity): boolean => {
    return identity.isAdmin;
}

export const IsAdminAuthorize = (): MethodDecorator => {
    return (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
        Reflect.defineMetadata('mvc:authorization:event', <IAuthorizationEvent>checkIsAdmin, target, propertyKey);
    }
}