import { IBrowserServicesManagerConfig } from './IBrowserServicesManagerConfig';
import { BaseServicesManager } from '../Common/BaseServicesManager';
import { BaseServiceModule } from '../Common/BaseServiceModule';

export class BrowserServicesManager extends BaseServicesManager {

    private readonly _config: IBrowserServicesManagerConfig;

    constructor(config: IBrowserServicesManagerConfig = {}) {
        super();
        this._config = config;
    }

    onError(err: Error, service: BaseServiceModule): void {
        super.onError(err, service);
        if (this._config.stopOnError) this.stop(1);
    }
}