import { NodeServiceManagerConfig } from './NodeServiceManagerConfig';
import { BaseServiceManager } from '../Base/BaseServiceManager';
import { ServiceModule } from '../Base/ServiceModule';

/**
 * 在 BaseServiceManager 的基础上添加了全局未捕获异常处理，退出信号控制。
 * 通过process.on('message')的方式进行健康检查（发送__ss__healthCheck调用健康检查，
 * { isHealth: boolean, description: string, type='healthCheck' }返回检查结果）。
 */
export class NodeServiceManager extends BaseServiceManager {

    private readonly _config: NodeServiceManagerConfig;

    constructor(config: NodeServiceManagerConfig = {}) {
        super();
        this._config = config;

        process.on('unhandledRejection', e => e ? 'message' in e ? this.onUnHandledException(e) :
            this.onUnHandledException(new Error(e.toString())) : this.onUnHandledException(new Error()));
            
        process.on('uncaughtException', e => this.onUnHandledException(e));
        process.on('SIGTERM', () => this.onStopSignal());
        process.on('SIGINT', () => this.onStopSignal());

        if (process.connected) { // 健康检查
            const listener = async (message: string): Promise<void> => {
                if (message === '__ss__healthCheck') {
                    const result = await this.healthCheck();
                    
                    // @ts-expect-error
                    result.type = 'healthCheck';
                    process.send?.(result);
                }
            };

            process.on('message', listener);
            process.once('disconnect', () => process.removeListener('message', listener));
        }

        if (this._config.exitAfterStopped !== false) this.on('stopped', code => process.exit(code));
    }

    onError(err: Error, service: ServiceModule): void {
        super.onError(err, service);
        if (this._config.stopOnError) this.stop(2);
    }

    onUnHandledException(err: Error): void {
        super.onUnHandledException(err);
        if (this._config.stopOnUnHandledException !== false) this.stop(1);
    }

    /**
     * 当收到SIGTERM信号时触发执行，判断是否终止程序
     */
    onStopSignal(): void {
        if (this._config.stopOnHaveSIGTERM !== false) this.stop();
    }
}