import { Injectable } from '@angular/core';
import { ModalComponent } from './modal.component';

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
}