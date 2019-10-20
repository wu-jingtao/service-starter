import { IBrowserServicesManagerConfig } from './IBrowserServicesManagerConfig';
import { BaseServicesManager } from './../common/BaseServicesManager';
import { BaseServiceModule } from '../common/BaseServiceModule';

export class BrowserServicesManager extends BaseServicesManager {

    private readonly _config: IBrowserServicesManagerConfig;

    constructor(config: IBrowserServicesManagerConfig = {}) {
        super();
        this._config = config;
    }

    onError(err: Error, service: BaseServiceModule): void {
        super.onError(err, service);
        if (this._config.stopOnError === true) this.stop(1);
    }
}