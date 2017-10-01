import { NodeServicesManagerConfig } from './NodeServicesManagerConfig';
import { BaseServicesManager } from '../common/BaseServicesManager';
import { BaseServiceModule } from '../common/BaseServiceModule';
/**
 * 在BaseServicesManager的基础上添加了全局未捕获异常处理，退出信号控制。
 * 通过process.on('message')的方式进行健康检查（发送__ss__healthCheck调用健康检查，
 * { isHealth: boolean, description: string, type='healthCheck' }返回检查结果）。
 *
 * @export
 * @class NodeServicesManager
 * @extends {BaseServicesManager}
 */
export declare class NodeServicesManager extends BaseServicesManager {
    private readonly _config;
    constructor(_config?: NodeServicesManagerConfig);
    onError(errName: string | undefined, err: Error, service: BaseServiceModule): void;
    onUnHandledException(err: Error): void;
}
