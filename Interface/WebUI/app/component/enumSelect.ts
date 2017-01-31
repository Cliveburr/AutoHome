import { Component, OnInit, Input, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export const SELECT_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => EnumSelect),
    multi: true
};

@Component({
  selector: 'enumselect',
  template: `<div class="row"><select class="custom-select col-sm-12" [ngModel]="value" (ngModelChange)="onChange($event)" name="sel">
<option *ngFor="let key of keys" [value]="key" [label]="list[key]"></option></select></div>`,
  providers: [SELECT_VALUE_ACCESSOR]
})
export class EnumSelect implements OnInit, ControlValueAccessor {

    private onTouchedCallback: () => void;
    private onChangeCallback: (_: any) => void;
    public keys: Array<string>;
    private value: string;

    @Input()
    public list: any;

    public ngOnInit(): void {
        this.keys = Object.keys(this.list).filter(k => !isNaN(Number(k)));
    }

    public writeValue(v: any) {
        this.value = v;
    }

    public registerOnChange(fn: any) {
        this.onChangeCallback = fn;
    }

    public registerOnTouched(fn: any) {
        this.onTouchedCallback = fn;
    }

    public onChange(v: any) {
        this.value = v;
        this.onChangeCallback(v);
    }
}