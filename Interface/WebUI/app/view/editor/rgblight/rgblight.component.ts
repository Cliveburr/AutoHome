import { Component, OnInit, ViewChild } from '@angular/core';
import { BaseView } from '../../shared/baseView';
import { StandardModel, StandardListModel } from '../../../model/standardModel';
import { StandardService } from '../../../service/standardService';
import { ColorPickerService } from 'angular2-color-picker';
import { ModuleModel } from '../../../model/moduleModel';
import { ModuleService } from '../../../service/moduleService';
import { RgbLightModel } from '../../../model/rgbLightModel';
import { NgbTabChangeEvent } from '@ng-bootstrap/ng-bootstrap';

@Component({
  moduleId: module.id,
  templateUrl: 'rgblight.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class RgbLightComponent implements OnInit {
    
    public type: string;
    public id: string;
    public header: string;
    public standard: StandardModel;
    public module: ModuleModel;
    public color: string = "#FFFFFF";
    public moduleTab: string;
    public standardList: StandardListModel[];

    public constructor(
        private base: BaseView,
        private standardService: StandardService,
        private moduleService: ModuleService,
        private cpService: ColorPickerService
    ) {
        this.header = '';
    }

    public ngOnInit(): void {
        this.base.route.params.subscribe(params => {
            this.type = params['type'];
            this.id = params['id'];
            this.onRefresh();
        });
    }

    public onRefresh(): void {
        if (this.type == 'standard') {
            this.standardService
                .getByID(this.id)
                .then((data) => this.setStandardMode(data));
        }
        else if (this.type == 'module') {
            this.moduleService
                .getByID(this.id)
                .then((data) => this.setModuleMode(data));
        }
    }

    private setStandardMode(data: StandardModel): void {
        this.standard = data;
        this.header = `Standard ${this.standard.name}`;
        if (this.standard.value) {
            this.setColor(this.standard.value);
        }
    }

    private setModuleMode(data: ModuleModel): void {
        this.header = `Module ${data.alias}`;
        if (!data.state) {
            data.state = {
                isStandard: false,
                standardId: null,
                value: null
            };
        }
        this.loadStandardList(data)
            .then(() => {
                this.moduleTab = data.state.isStandard ? 'byStandard': 'byManual';
                if (data.state.value) {
                    this.setColor(data.state.value);
                }
                this.module = data;
            });
    }

    private loadStandardList(module: ModuleModel): Promise<null> {
        return new Promise((e, r) => {
        this.standardService
            .getListByType(this.moduleService.getStandardType(module.type))
            .then((data) => {
                this.standardList = data;
                e();
            });
        });
    }

    private setColor(value: RgbLightModel): void {
        this.color = this.cpService.hexText({
            r: value.red,
            g: value.green,
            b: value.blue,
            a: 1
        }, true);
    }

    public get isStandard(): boolean {
        return this.type == 'standard' && this.standard != undefined;
    }

    public get isModule(): boolean {
        return this.type == 'module' && this.module != undefined;
    }

    public onBack(): void {
        this.base.back();
    }

    public onApply(): void {
        let hsva = this.cpService.stringToHsva(this.color);
        let rgb = this.cpService.denormalizeRGBA(this.cpService.hsvaToRgba(hsva));

        let value = {
            red: rgb.r,
            green: rgb.g,
            blue: rgb.b
        };

        if (this.isStandard) {
            this.standard.value = value;
            this.standardService
                .updateValue(this.standard);
        }
        else if (this.isModule) {
            this.module.state.value = value;
            this.moduleService
                .updateState(this.module);
        }
    }

    public onModuleTabChange(event: NgbTabChangeEvent): void {
        this.module.state.isStandard = event.nextId == 'byStandard';
    }
}