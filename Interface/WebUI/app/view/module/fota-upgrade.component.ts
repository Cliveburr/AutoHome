import { Component, OnInit } from '@angular/core';
import { IndexModule } from '../../model/moduleModel';
import { ModuleVersionService } from '../../service/moduleversion.service';
import { IndexModule as VersionIndexModule } from '../../model/moduleversion.model';
import { NotifyService, NotifyType } from '../../component/notify.service';

@Component({
  moduleId: module.id,
  templateUrl: 'fota-upgrade.component.html',
  styleUrls: [  ],
  providers: [ ]
})
export class FotaUpgradeComponent implements OnInit {
    public model: IndexModule[];
    public versions: VersionIndexModule[];
    public versionSel: VersionIndexModule;
    public onCloseEvent: () => void;

    public constructor(
        private moduleVersionService: ModuleVersionService,
        private notify: NotifyService
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
            .getFilter(sels[0].type)
            .then(data => this.versions = data);
    }

    public onApply() : void {
        let ids = this.model.map(m => m.moduleId);
        let versionId = this.versionSel.moduleVersionId;

        this.moduleVersionService
            .postFOTAUpgrade(ids, versionId)
            .then(data => {
                this.notify.addMessage(NotifyType.Success, '<strong>FOTA Upgrade!</strong> Modules successfully upgrade.', 3000);
                this.onCloseEvent();
            });
    }
}