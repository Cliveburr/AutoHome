import { Component, OnInit, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NotifyService, NotifyMessage } from './notify.service';

@Component({
    selector: 'notify',
    template: `<div class="container col-xs-11 col-sm-4">
  <alert *ngFor="let msg of messages" class="fade show" [type]="msg.typeText" dismissible="true" [dismissOnTimeout]="msg.timeout" (onClosed)="alert_onClosed(msg)"><span [innerHtml]="msg.htmlText"></span></alert>
</div>`,
    styles: [
        '.container { display: inline-block; margin: 0px auto; position: fixed; top: 20px; right: 20px; z-index: 1031; }',
        'alert { transition: all 0.5s ease-in-out; animation-iteration-count: 1; }'
    ]
})
export class NotifyComponent implements OnInit {

    public messages: Array<NotifyMessage> = [];

    public constructor(
        private sanitizer: DomSanitizer,
        private service: NotifyService
    ) {
    }

    public ngOnInit(): void {
        this.service.setComponent(this);
    }

    public addMessage(msg: NotifyMessage): void {
        msg.htmlText = this.sanitizer.sanitize(SecurityContext.HTML, msg.htmlText);
        
        this.messages.push(msg);
    }

    public alert_onClosed(msg: NotifyMessage): void {
        let i = this.messages.indexOf(msg);
        if (i > -1) {
            this.messages.splice(i, 1);
        }
    }
}