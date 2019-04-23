import { Injectable } from '@angular/core';
import { NotifyComponent } from './notify.component';

var staticData = {
    component: <NotifyComponent>null
};

@Injectable()
export class NotifyService {

    public setComponent(component: NotifyComponent): void {
        if (staticData.component)
            throw 'Only one modal component can be exist!';
        staticData.component = component;
    }

    public addMessage(type: NotifyType, text: string, timeout?: number): void {
        staticData.component.addMessage(new NotifyMessage(type, text, timeout));
    }
}

export enum NotifyType {
    Success,
    Info,
    Warning,
    Danger
}

export class NotifyMessage {

    public constructor(
        public type: NotifyType,
        public htmlText: string,
        public timeout?: number
    ) {
    }

    public get typeText(): string {
        switch (this.type) {
            case NotifyType.Info: return 'info';
            case NotifyType.Warning: return 'warning';
            case NotifyType.Danger: return 'danger';
            default: return 'success';
        }
    }
}