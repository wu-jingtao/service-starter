import { BrowserServicesManagerConfig } from './BrowserServicesManagerConfig';
import { BaseServicesManager } from './../common/BaseServicesManager';
import { RunningStatus } from '../common/RunningStatus';
import { BaseServiceModule } from '../common/BaseServiceModule';

export class BrowserServicesManager extends BaseServicesManager {
    constructor(private readonly _config: BrowserServicesManagerConfig = {}) {
        super();
    }

    onError(errName: string | undefined, err: Error, service: BaseServiceModule) {
        super.onError(errName, err, service);
        if (this._config.stopOnError === true) {
            if (this.status !== RunningStatus.stopping && this.status !== RunningStatus.stopped) {
                this.stop(1);
            }
        }
    }
}