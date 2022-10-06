import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ModuleModel } from 'src/model';
import { BaseService, ModuleService } from 'src/service';

@Component({
    templateUrl: './discovery.component.html'
})
export class DiscoveryComponent implements OnDestroy {

    public model: ModuleModel[];
    private getTimeout?: any;
    private fromTime: Date;
    private stopCouting: number;

    public constructor(
        private base: BaseService,
        private moduleService: ModuleService,
        private router: Router
    ) {
        this.model = [];
        this.fromTime = new Date(0);
        this.stopCouting = 0;
        this.getTimeout = setTimeout(this.getModules.bind(this), 1);
    }
    
    public ngOnDestroy(): void {
        if (this.getTimeout) {
            clearTimeout(this.getTimeout);
            delete this.getTimeout;
        }
    }

    public async refresh(): Promise<void> {
        this.fromTime = new Date(0);
        this.model = [];
        this.stopCouting = 0;
        await this.base.withLoading(
            this.moduleService.refreshDiscovery()
        );
        this.startTimeout();
    }

    private startTimeout(): void {
        if (!this.getTimeout) {
            this.getTimeout = setTimeout(this.getModules.bind(this), 1000);
        }
    }

    private async getModules(): Promise<void> {
        delete this.getTimeout;
        const newFromTime = new Date(Date.now());
        const newModules = await this.moduleService.getModuleList({
            fromTime: this.fromTime
        });
        if (newModules.length == 0) {
            this.stopCouting++;
        }
        else {
            this.model.push(...newModules);
        }
        this.fromTime = newFromTime;
        if (this.stopCouting < 30) {
            this.startTimeout();
        }
    }

    public selectModule(mod: ModuleModel): void {
        this.moduleService.selected = mod;
        this.router.navigateByUrl('/home');
    }
}
