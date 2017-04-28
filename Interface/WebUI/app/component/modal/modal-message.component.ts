import { Component, ViewChild } from '@angular/core';

@Component({
  moduleId: module.id,
  templateUrl: 'modal-message.component.html'
})
export class ModalMessageComponent {

    @ViewChild('staticModal')
    public staticModal: any;

    public constructor(
    ) {
    }

}