import { Component, OnInit } from '@angular/core';
import { BaseView } from '../shared/baseView';
import { EditViewModel } from '../../model/moduleversion.model';
import { ModuleType } from '../../model/moduleModel';
import { ModuleVersionService } from '../../service/moduleversion.service';
import { NotifyType } from '../../component/notify.service';

@Component({
  moduleId: module.id,
  templateUrl: 'moduleversion-edit.component.html',
  styleUrls: [  ],
  providers: [ BaseView ]
})
export class ModuleVersionEditComponent implements OnInit {
    public model: EditViewModel;
    public id: string;
    public moduleType = ModuleType;

    public constructor(
        private base: BaseView,
        private moduleVersionService: ModuleVersionService
    ) {
    }

    public ngOnInit(): void {
        this.base.route.params.subscribe(params => {
            this.id = params['id'];
            this.onRefresh();
        });
    }

    public onRefresh(): void {
        this.moduleVersionService
            .getEdit(this.id)
            .then((data) => this.model = data);
    }

    public onSave(): void {
        this.moduleVersionService
            .postEdit(this.model)
            .then(() => this.base.router.navigateByUrl('/moduleversion'));
    }

    public onBack(): void {
        this.base.back();
    }

    public userChange(user: number, e: Event): void {
        let input = e.target as HTMLInputElement;
        
        if (input.files.length == 0)
            return;
        
        let file = input.files[0];
        let reader = new FileReader();

        reader.onloadend = (e: ProgressEvent) => this.userChangeLoaded(user, file.name, e);
        reader.readAsArrayBuffer(file);
    }

    public userChangeLoaded(user: number, file: string, e: ProgressEvent): void {
        let reader = e.target as FileReader;
        let arrayBuffer = reader.result as ArrayBuffer;
        let uint8Array = new Uint8Array(arrayBuffer);

        if (user == 1) {
            this.model.user1File = file;
            this.model.user1Blob = this.toBase64(uint8Array);
        }
        else if (user == 2) {
            this.model.user2File = file;
            this.model.user2Blob = this.toBase64(uint8Array);
        }
    }

    public onDownload(user: number): void {
        let fileBlob = user == 1 ? this.model.user1Blob : this.model.user2Blob;
        let fileName = user == 1 ? this.model.user1File : this.model.user2File;

        if (!(fileBlob && fileBlob.length > 0)) {
            this.base.notify.addMessage(NotifyType.Warning, '<strong>Download!</strong> Need to upload file to download!', 5000);
            return;
        }

        let file = new Blob([new Uint8Array(this.fromBase64(fileBlob))]);

        if (window.navigator.msSaveOrOpenBlob)
            window.navigator.msSaveOrOpenBlob(file, fileName);
        else {
            let a = document.createElement("a"),
                    url = URL.createObjectURL(file);
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);  
            }, 0); 
        }
    }

    private toBase64(u8: Uint8Array): string {
        return btoa(String.fromCharCode.apply(null, u8));
    }

    private fromBase64(str: string): number[]  {
        return atob(str).split('').map(c => c.charCodeAt(0));
    }
}