import { NodeServicesManagerConfig } from './NodeServicesManagerConfig';
import { BaseServicesManager } from '../common/BaseServicesManager';
import { BaseServiceModule } from '../common/BaseServiceModule';

/**
 * 在BaseServicesManager的基础上添加了全局未捕获异常处理，退出信号控制。
 * 通过process.on('message')的方式进行健康检查（发送__ss__healthCheck调用健康检查，
 * { isHealth: boolean, description: string, type='healthCheck' }返回检查结果）。
 */
export class NodeServicesManager extends BaseServicesManager {
    constructor(private readonly _config: NodeServicesManagerConfig = {}) {
        super();

        process.on('unhandledRejection', this.onUnHandledException.bind(this) as any);
        process.on('uncaughtException', this.onUnHandledException.bind(this));
        process.on('SIGTERM', () => _config.stopOnHaveSIGTERM !== false && this.stop());
        process.on('SIGINT', () => _config.stopOnHaveSIGTERM !== false && this.stop());

        if (process.connected) { //健康检查
            const listener = async (message: string) => {
                if (message === '__ss__healthCheck') {
                    const result: any = await this.healthCheck();
                    result.type = 'healthCheck';
                    process.send && process.send(result);
                }
            };
            process.on('message', listener);
            process.once('disconnect', () => {
                process.removeListener('message', listener);
            });
        }

        if (_config.exitAfterStopped !== false)
            this.on('stopped', code => process.exit(code));
    }

    onError(err: Error, service: BaseServiceModule) {
        super.onError(err, service);
        if (this._config.stopOnError === true) this.stop(1);
    }

    onUnHandledException(err: Error) {
        super.onUnHandledException(err);
        if (this._config.stopOnUnHandledException !== false) this.stop(1);
    }
}