import { Component, ViewChild, ComponentFactoryResolver, ViewContainerRef, Type, ComponentRef } from '@angular/core';
import { ModalDirective } from 'ng2-bootstrap';

@Component({
  moduleId: module.id,
  templateUrl: 'dynamic-modal.component.html'
})
export class DynamicModalComponent {

    @ViewChild('dynamicContainer', { read: ViewContainerRef })
    public dynamicContainer: ViewContainerRef;

    @ViewChild('dynamicModal')
    public dynamicModal: ModalDirective;

    public title: string;

    public constructor(
        private componentFactoryResolver: ComponentFactoryResolver
    ) {
    }

    public setContent<T extends DynamicModalInterface>(title: string, obj: Type<T>): T {
        this.title = title;

        let factory = this.componentFactoryResolver.resolveComponentFactory(obj);
        let ref = this.dynamicContainer.createComponent(factory);
        ref.changeDetectorRef.detectChanges();

        ref.instance.onCloseEvent = () => {
            this.dynamicModal.hide();
        };

        this.dynamicModal.show();

        return ref.instance;
    }
}

export interface DynamicModalInterface {
    onCloseEvent: () => void;
}