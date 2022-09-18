import { Component } from '@angular/core';
import { StateReadResponse } from 'src/model';
import { ModuleService, CellingFanService } from 'src/service';

@Component({
    selector: 'cellingFan',
    templateUrl: './cellingFan-module.component.html'
})
export class CellingFanModuleComponent {

    public model: StateReadResponse;

    public constructor(
        public moduleService: ModuleService,
        public cellingFanService: CellingFanService
    ) {
        this.model = <any>{
            light: false,
            fan: false,
            fanUp: false,
            fanSpeed: 0
        };
    }

    public async lightChange(): Promise<void> {
        await this.cellingFanService.setLight({
            model: this.moduleService.selected!,
            value: this.model.light
        });
    }

    public lightClick() {
        this.model.light = !this.model.light;
    }

    public async fanChange(): Promise<void> {
        await this.cellingFanService.setFan({
            model: this.moduleService.selected!,
            value: this.model.fan
        });
    }

    public fanClick() {
        this.model.fan = !this.model.fan;
    }

    public async fanUpChange(): Promise<void> {
        await this.cellingFanService.setFanUp({
            model: this.moduleService.selected!,
            value: this.model.fanUp
        });
    }

    public fanUpClick() {
        this.model.fanUp = !this.model.fanUp;
    }

    public async fanSpeedChange(): Promise<void> {
        await this.cellingFanService.setFanSpeed({
            model: this.moduleService.selected!,
            value: this.model.fanSpeed
        });
    }
}
