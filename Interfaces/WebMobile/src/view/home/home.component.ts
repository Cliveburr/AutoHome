import { AfterViewInit, Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { InitResponseArea, InitResponse } from 'src/model';
import { ModuleService, HomeService } from 'src/service';

interface Size {
    width: number;
    height: number;
}

interface Point {
    x: number;
    y: number;
}

interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

@Component({
    templateUrl: './home.component.html'
})
export class HomeComponent implements AfterViewInit {

    public isOnFocus: boolean;

    private data: InitResponse;
    private fullImage: HTMLImageElement;
    private images: { [name: string]: HTMLImageElement };
    private viewRating: number;
    private viewSize: Size;
    private imageBox: Box;
    private areaIn?: InitResponseArea;
    private areaInExpanded?: Box;
    private ctx: CanvasRenderingContext2D;
    private moduleSelectedEventSubscription: Subscription;

    public constructor(
        public moduleService: ModuleService,
        public homeService: HomeService
    ) {
        this.isOnFocus = false;
        this.images = {};
        //this.moduleSelectedEventSubscription = this.moduleService.selectedEvent.subscribe(this.ngAfterViewInit.bind(this));
    }

    public ngOnDestroy() {
        this.moduleSelectedEventSubscription.unsubscribe();
    }

    public async ngAfterViewInit() {
        // if (this.moduleService.selected?.moduleType) {
        //     return;
        // }

        this.data = await this.homeService.init();
        await this.createFullImage();

        this.viewSize = this.getViewPort();

        const homeCanvas = <HTMLCanvasElement>(<any>document).querySelector('#homeCanvas');
        this.ctx = homeCanvas.getContext('2d')!;
        homeCanvas.width = this.viewSize.width;
        homeCanvas.height = this.viewSize.height;

        delete this.areaIn;
        delete this.areaInExpanded;
        this.isOnFocus = false;
        this.drawFullImage();
    }

    private getViewPort(): Size {
        const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        let height = window.innerHeight || document.documentElement.clientHeight|| document.body.clientHeight;
        height -= 118;
        return {width, height};
    }

    private centerImage(size: Size): Box {
        const width = size.width * this.viewRating;
        const height = size.height * this.viewRating;
        return {
            x: (this.viewSize.width / 2) - (width / 2),
            y: (this.viewSize.height / 2) - (height / 2),
            width,
            height
        }
    }

    private calculateViewRating(size: Size): void {
        let imageRatingX = this.viewSize.width / size.width;
        imageRatingX = imageRatingX > 1 ? 1 : imageRatingX;
        let imageRatingY = this.viewSize.height / size.height;
        imageRatingY = imageRatingY > 1 ? 1 : imageRatingY;

        this.viewRating = Math.min(imageRatingX, imageRatingY);
    }

    private createFullImage(): Promise<void> {
        return new Promise<void>((e, r) =>{
            this.fullImage = new Image();
            this.fullImage.onload = () => {
                e();
            };
            this.fullImage.src = 'data:image/jpeg;base64,' + this.data.fullImage;
        });
    }

    private drawFullImage(): void {
        
        this.ctx.clearRect(0, 0, this.viewSize.width, this.viewSize.height);

        this.calculateViewRating(this.fullImage);
        this.imageBox = this.centerImage(this.fullImage);

        this.ctx.drawImage(this.fullImage, 0, 0, this.fullImage.width, this.fullImage.height, this.imageBox.x, this.imageBox.y, this.imageBox.width, this.imageBox.height);
    }

    private drawAreaImage(): void {

        if (!this.areaIn) {
            return;
        }

        this.ctx.clearRect(0, 0, this.viewSize.width, this.viewSize.height);

        const globalMargin = this.data.globalMargin;
        this.areaInExpanded = {
            x: Math.min(this.areaIn.x, this.areaIn.x - globalMargin),
            y: Math.min(this.areaIn.y, this.areaIn.y - globalMargin),
            width: Math.max(this.areaIn.width, this.areaIn.width + (2 * globalMargin)),
            height: Math.max(this.areaIn.height, this.areaIn.height + (2 * globalMargin))
        }

        this.calculateViewRating(this.areaInExpanded);
        this.imageBox = this.centerImage(this.areaInExpanded);
        
        this.ctx.drawImage(this.fullImage, this.areaInExpanded.x, this.areaInExpanded.y, this.areaInExpanded.width, this.areaInExpanded.height, this.imageBox.x, this.imageBox.y, this.imageBox.width, this.imageBox.height);
    }

    private relMouseCoords(ev: MouseEvent): Point {
        
        const rect = (<HTMLCanvasElement>ev.target).getBoundingClientRect();
        let canvasX = ev.clientX - rect.left;
        let canvasY = ev.clientY - rect.top;
        return {x:canvasX, y:canvasY}
    }

    public async img_click(ev: MouseEvent): Promise<void> {
        
        debugger;
        const mouse = this.relMouseCoords(ev);
        mouse.x -= this.imageBox.x;
        mouse.y -= this.imageBox.y;

        if (this.isOnFocus && this.areaInExpanded) {
            const onModule = this.getAreaIn(this.areaInExpanded.x + (mouse.x / this.viewRating), this.areaInExpanded.y + (mouse.y / this.viewRating));
            if (onModule) {
                const getMod = await this.moduleService.getModuleByUID(onModule.uid);
                if (getMod) {
                    this.moduleService.navigateToModuleHome(getMod);
                    return;
                }
            }

            this.drawFullImage();
            this.isOnFocus = false;
            delete this.areaIn;
            delete this.areaInExpanded;
        }
        else {
            this.areaIn = this.getAreaIn(mouse.x / this.viewRating, mouse.y / this.viewRating);
            if (this.areaIn) {
                this.drawAreaImage();
                
                const areasInside = this.getAreasInside();
                for (let areaInside of areasInside) {
                    setTimeout(this.drawAreaInside.bind(this, areaInside), 1);
                }

                this.isOnFocus = true;
            }
        }
    }

    private getAreaIn(x: number, y: number) {
        for (let area of this.data.areas) {
            if (x > area.x && x < (area.x + area.width) &&
                y > area.y && y < (area.y + area.height)) {
                    if (this.areaIn) {
                        if (this.areaIn.name != area.name) {
                            return area;
                        }
                    }
                    else {
                        return area;
                    }
                }
        }
        return undefined;
    }

    private getAreasInside(): InitResponseArea[] {
        const tr = <InitResponseArea[]>[];
        if (this.areaIn) {
            for (let area of this.data.areas) {
                if (area.x > this.areaIn.x && (area.x + area.width) < (this.areaIn.x + this.areaIn.width)
                    && area.y > this.areaIn.y && (area.y + area.height) < (this.areaIn.y + this.areaIn.height)) {
                        tr.push(area);
                    }
            }
        }
        return tr;
    }

    private async drawAreaInside(area: InitResponseArea): Promise<void> {
        let image = this.images[area.image];
        if (!image) {
            this.images[area.image] = image = await this.loadImage(area.image);
        }

        const x = ((area.x - this.areaInExpanded!.x) * this.viewRating) + this.imageBox.x;
        const y = ((area.y - this.areaInExpanded!.y) * this.viewRating) + this.imageBox.y;
        const width = area.width * this.viewRating;
        const height = area.height * this.viewRating;

        this.ctx.drawImage(image, 0, 0, image.width, image.height, x, y, width, height);
    }

    private loadImage(name: string): Promise<HTMLImageElement> {
        return new Promise<HTMLImageElement>((e, r) =>{
            const image = new Image();
            image.onload = () => {
                e(image);
            };
            image.src = document.baseURI + 'assets/' + name;
        });
    }
}
