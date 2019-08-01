import { BrowserServicesManagerConfig } from './BrowserServicesManagerConfig';
import { BaseServicesManager } from './../common/BaseServicesManager';
import { BaseServiceModule } from '../common/BaseServiceModule';

export class BrowserServicesManager extends BaseServicesManager {
    constructor(private readonly _config: BrowserServicesManagerConfig = {}) { super() }

    onError(err: Error, service: BaseServiceModule) {
        super.onError(err, service);
        if (this._config.stopOnError === true) {
            this.stop(1);
        }
    }
}