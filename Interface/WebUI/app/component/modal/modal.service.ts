import { Injectable, Type } from '@angular/core';
import { ModalComponent } from './modal.component';
import { DynamicModalInterface } from './dynamic-modal.component';

var staticData = {
    component: <ModalComponent>null
};

@Injectable()
export class ModalService {

    public setComponent(component: ModalComponent): void {
        if (staticData.component)
            throw 'Only one modal component can be exist!';
        staticData.component = component;
    }

    public showModal(): void {
        staticData.component.showModal();
    }

    public createDynamic<T extends DynamicModalInterface>(title: string, obj: Type<T>): T {
        let modal = staticData.component.showDynamicModal();
        let instance = modal.setContent(title, obj);
        return instance;
    }
}