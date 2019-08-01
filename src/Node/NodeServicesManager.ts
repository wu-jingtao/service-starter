import log from 'log-formatter';
import { NodeServicesManagerConfig } from './NodeServicesManagerConfig';
import { BaseServicesManager } from '../common/BaseServicesManager';
import { BaseServiceModule } from '../common/BaseServiceModule';
import { RunningStatus } from '../common/RunningStatus';

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

        let forceClose = false;     //用于标记是否强制退出程序
        const signalClose = () => {
            if (this.runningStatus !== RunningStatus.stopping) {
                if (this.runningStatus === RunningStatus.stopped) {
                    process.exit();
                } else {
                    this.stop();
                }
            } else {
                if (forceClose === false) {
                    log.noTime.title.text.gray('正在停止程序，请稍后。。。', '（如果要强制退出，请在3秒钟之内再次点击）');
                    forceClose = true;
                    setTimeout(() => forceClose = false, 3000);
                } else {
                    process.exit();
                }
            }
        };

        process.on('SIGTERM', () => {
            if (_config.stopOnHaveSIGTERM !== false) {
                signalClose();
            }
        });

        process.on('SIGINT', () => {
            if (_config.stopOnHaveSIGINT !== false) {
                signalClose();
            }
        });

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
        if (this._config.stopOnError === true) {
            if (this.runningStatus === RunningStatus.stopped) {
                process.exit(1);
            } else {
                this.stop(1);
            }
        }
    }

    onUnHandledException(err: Error) {
        super.onUnHandledException(err);
        if (this._config.stopOnUnHandledException !== false) {
            if (this.runningStatus === RunningStatus.stopped) {
                process.exit(1);
            } else {
                this.stop(1);
            }
        }
    }
}