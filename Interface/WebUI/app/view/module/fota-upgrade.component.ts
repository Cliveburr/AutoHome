import { Component, OnInit } from '@angular/core';
import { EditViewModel, WifiConfigurationModel } from '../../model/moduleModel';
import { ModuleVersionService } from '../../service/moduleversion.service';
import { IndexModule } from '../../model/moduleModel';

@Component({
  moduleId: module.id,
  templateUrl: 'fota-upgrade.component.html',
  styleUrls: [  ],
  providers: [ ]
})
export class FotaUpgradeComponent implements OnInit {
    public model: IndexModule[];
    public onApplyEvent: (data: WifiConfigurationModel) => void;
    public onCloseEvent: () => void;

    public constructor(
        private moduleVersionService: ModuleVersionService
    ) {
    }

    public onClose() : void {
        this.onCloseEvent();
    }

    public ngOnInit(): void {
    }

    public setModules(sels: IndexModule[]): void {
        this.model = sels;
        this.moduleVersionService
            .getVersionForType(sels[0].type)
            .then(data => this.versions = data);
    }

    public onApply() : void {
        this.onApplyEvent(this.model);
        this.onCloseEvent();
    }
}