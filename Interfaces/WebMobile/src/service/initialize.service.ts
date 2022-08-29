import { APP_INITIALIZER, Provider, Injectable } from '@angular/core'
import { SessionService } from './session.service';

@Injectable()
export class InitializerService {

    public constructor(
        private sessionService: SessionService
    ) {
    }

    public async load(): Promise<void> {
        await this.sessionService.initialize();
    }
}

export function InitializerProviderFactory(initializertService: InitializerService) {
    return () => initializertService.load();
}

export const InitializerProvider: Provider = {
    provide: APP_INITIALIZER,
    useFactory: InitializerProviderFactory,
    deps: [InitializerService],
    multi: true
};

export const ALL_INITIALIZERS = [
    InitializerService,
    InitializerProvider
];