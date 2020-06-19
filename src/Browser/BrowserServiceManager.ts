import { BrowserServiceManagerConfig } from './BrowserServiceManagerConfig';
import { BaseServiceManager } from '../Base/BaseServiceManager';
import { ServiceModule } from '../Base/ServiceModule';

export class BrowserServicesManager extends BaseServiceManager {

    private readonly _config: BrowserServiceManagerConfig;

    constructor(config: BrowserServiceManagerConfig = {}) {
        super();
        this._config = config;
    }

    onError(err: Error, service: ServiceModule): void {
        super.onError(err, service);
        if (this._config.stopOnError) this.stop(1);
    }
}