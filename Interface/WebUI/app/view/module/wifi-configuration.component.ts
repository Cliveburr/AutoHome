import { Component } from '@angular/core';
import { EditViewModel, WifiConfigurationModel } from '../../model/moduleModel';
import { ModuleService } from '../../service/moduleService';

@Component({
  moduleId: module.id,
  templateUrl: 'wifi-configuration.component.html',
  styleUrls: [  ],
  providers: [ ]
})
export class WifiConfigurationComponent {
    public model: WifiConfigurationModel = {
        wifiname: '',
        wifipass: ''
    };
    public onApplyEvent: (data: WifiConfigurationModel) => void;
    public onCloseEvent: () => void;

    public onClose() : void {
        this.onCloseEvent();
    }

    public onApply() : void {
        this.onApplyEvent(this.model);
        this.onCloseEvent();
    }
}