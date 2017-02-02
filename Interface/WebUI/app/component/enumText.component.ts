import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'enumtext',
    template: `{{text}}`
})
export class EnumTextComponent implements OnInit {

    public keys: Array<string>;
    public text: string;

    @Input() public enum: any;
    @Input() public value: number;

    public ngOnInit(): void {
        this.text = this.enum[this.value];
    }
}