import { Injectable } from 'providerjs';
import { IPipeline, IContext } from 'webhost';
import { parse } from 'url';

@Injectable()
export class SpaPipe implements IPipeline {

     public process(ctx: IContext, next: () => void): void {
        
        if (ctx.request.url!.indexOf('node_modules_ionic_core_dist_esm_ion-toggle_entry_js') > -1) {
            var a = 1;
        }

        let isAjax = ctx.request.headers['x-requested-with'] == 'XMLHttpRequest';
        let pathname = parse(ctx.request.url || '').pathname || '';
        if (!isAjax && pathname.indexOf('.') == -1 && !pathname.startsWith('/api/')) {
            ctx.request.url = '/index.html';
        } 
        next();
    }
}