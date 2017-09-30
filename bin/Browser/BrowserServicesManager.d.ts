import { BrowserServicesManagerConfig } from './BrowserServicesManagerConfig';
import { BaseServicesManager } from './../common/BaseServicesManager';
import { BaseServiceModule } from '../common/BaseServiceModule';
export declare class BrowserServicesManager extends BaseServicesManager {
    private readonly _config;
    constructor(_config?: BrowserServicesManagerConfig);
    onError(errName: string | undefined, err: Error, service: BaseServiceModule): void;
}
