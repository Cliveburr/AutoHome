import { Component, OnInit, ComponentFactoryResolver, ViewContainerRef } from '@angular/core';
import { ModalService } from './modal.service';
import { ModalMessageComponent } from './modal-message.component';
import { DynamicModalComponent } from './dynamic-modal.component';

@Component({
  moduleId: module.id,
  selector: 'modal',
  template: '<div></div>'
})
export class ModalComponent implements OnInit {

    public constructor(
        private componentFactoryResolver: ComponentFactoryResolver,
        private viewContainerRef: ViewContainerRef,
        private service: ModalService
    ) {
    }

    public ngOnInit(): void {
        this.service.setComponent(this);
    }

    public showModal(): void {
        let factory = this.componentFactoryResolver.resolveComponentFactory(ModalMessageComponent);
        let ref = this.viewContainerRef.createComponent(factory);
        ref.changeDetectorRef.detectChanges();

        ref.instance.staticModal.show();
    }

    public showDynamicModal(): DynamicModalComponent {
        let factory = this.componentFactoryResolver.resolveComponentFactory(DynamicModalComponent);
        let ref = this.viewContainerRef.createComponent(factory);
        ref.changeDetectorRef.detectChanges();

        return ref.instance;
    }
}

export const MODAL_COMPONENTS = [ModalComponent, ModalMessageComponent, DynamicModalComponent];