import { Component, OnInit } from '@angular/core';
import { BaseView } from '../shared/baseView';
import { IndexViewModel, IndexModule, ModuleType } from '../../model/moduleModel';
import { ModuleService } from '../../service/moduleService';
import { NotifyType } from '../../component/notify.service';
import { WifiConfigurationComponent } from './wifi-configuration.component';
import { FotaUpgradeComponent } from './fota-upgrade.component';

@Component({
  moduleId: module.id,
  templateUrl: 'module.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class ModuleComponent implements OnInit {
    public model: IndexViewModel;
    public moduleType = ModuleType;

    public componentData: any;

    public constructor(
        private base: BaseView,
        private moduleService: ModuleService
    ) {
    }

    public ngOnInit(): void {
        this.onRefresh();
    }

    public onRefresh(): void {
        this.moduleService
            .getIndex()
            .then((data) => this.model = data);
    }

    public onDiscovery(): void {
        this.moduleService
            .discovery();
    }

    public onDelete(module: IndexModule): void {
        this.moduleService
            .delete(module.moduleId)
            .then(() => this.onRefresh());
    }

    public onBack(): void {
        this.base.back();
    }
    
    public onPing(module: IndexModule): void {
        this.moduleService
            .ping(module.moduleId)
            .then(() => this.onRefresh());
    }

    public onWifiConfiguration(): void {
        let sels = this.getSel();

        if (sels.length == 0) {
            this.base.notify.addMessage(NotifyType.Warning, '<strong>Selection!</strong> You need to select at least one module to configurate.', 5000);
            return;
        }

        let model = this.base.modal.createDynamic<WifiConfigurationComponent>('Enter the Wifi Configuration', WifiConfigurationComponent);
        model.onApplyEvent = (data) => {
            for (let sel of sels) {
                this.moduleService
                    .postWifiConfiguration(sel.moduleId, data)
                    .then(() => this.base.notify.addMessage(NotifyType.Success, '<strong>Configuration!</strong> Wifi configuration successfully.', 3000),
                        () => this.base.notify.addMessage(NotifyType.Danger, '<strong>Error!</strong> Wifi configuration error.'));
            }
        };
    }

    public onChkSelChange(value: boolean): void {
        for (var module of this.model.list) {
            module.sel = value;
        }
    }

    private getSel(): IndexModule[] {
        return this.model.list.filter(m => m.sel);
    }

    public onFOTAUpgrade(): void {
        let sels = this.getSel();

        if (sels.length == 0) {
            this.base.notify.addMessage(NotifyType.Warning, '<strong>FOTA Upgrade!</strong> Need to select at least one to upgrade.', 5000);
            return;
        }

        let ttype = sels[0].type;
        if (sels.filter(s => s.type != ttype).length > 0) {
            this.base.notify.addMessage(NotifyType.Warning, '<strong>FOTA Upgrade!</strong> Only module with the same type can be upgrade at same time.', 5000);
            return;
        }

        let model = this.base.modal.createDynamic<FotaUpgradeComponent>('FOTA Upgrade', FotaUpgradeComponent);
        model.setModules(sels);
    }
}