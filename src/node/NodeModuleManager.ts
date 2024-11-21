import log from 'log-formatter';
import { ModuleManager, type ModuleManagerOptions } from '../base/ModuleManager';
import { RunningStatus } from '../base/RunningStatus';

const print_failure: (description: string, err: unknown) => void = log.error.dateTime.text.red.linebreak;

/**
 * Node.js 模块管理器配置参数
 */
export interface NodeModuleManagerOptions extends ModuleManagerOptions {
    /**
     * 当服务管理器关闭后是否退出程序，默认 true
     */
    exitAfterStopped?: boolean;
    /**
     * 当收到 SIGTERM 信号时是否关闭模块管理器，默认 true
     */
    stopOnSIGTERM?: boolean;
    /**
     * 当收到 SIGINT 信号时是否关闭模块管理器，默认 true
     */
    stopOnSIGINT?: boolean;
    /**
     * 是否打印未捕获异常，默认 true
     */
    printUnhandledError?: boolean;
    /**
     * 当有未捕获异常（包括 promise rejection）产生时是否关闭模块管理器
     */
    stopOnUnhandledError?: boolean;
}

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
    /**
     * 是否健康
     */
    healthy: boolean;
    /**
     * 模块管理器的运行状态
     */
    managerStatue: keyof typeof RunningStatus;
    /**
     * 健康检查失败模块名称，为空则表示模块管理器出现了问题
     */
    moduleName?: string | undefined;
    /**
     * 健康检查失败错误信息
     */
    description?: string;
    /**
     * 标记该条消息是健康检查的结果
     */
    type: 'health_check';
}

/**
 * 在 ModuleManager 的基础上添加了全局未捕获异常处理，退出信号控制，健康检查调用
 * @description
 * 父进程通过 subprocess.send('\_\_health_check\_\_') 进行健康检查，
 * 子进程返回 { healthy: boolean, moduleName:string , description: string, type='health_check' } 作为检查结果）。
 * @description 事件列表
 * ```typescript
 * on(event: 'started', listener: () => void): Emitter;
 * on(event: 'stopped', listener: (exitCode: number) => void): Emitter;
 * on(event: 'error', listener: (error: Error, module: Module) => void): Emitter;
 * on(event: 'unhealthy', listener: (error: Error, module: Module) => void): Emitter;
 * on(event: 'unhandledError', listener: (error: Error) => void): Emitter;
 * ```
 */
export class NodeModuleManager extends ModuleManager {
    /**
     * NodeModuleManager 是否已经创建（一个进程只允许创建一个 NodeModuleManager）
     */
    private static _managerCreated = false;

    constructor(options: NodeModuleManagerOptions = {}) {
        super(options);

        if (NodeModuleManager._managerCreated) {
            throw new Error('一个进程只允许创建一个 NodeModuleManager');
        } else {
            NodeModuleManager._managerCreated = true;
        }

        if (options.exitAfterStopped ?? true) {
            this.on('stopped', (exitCode: number) => setTimeout(() => process.exit(exitCode), 10));
        }

        if (options.stopOnSIGTERM ?? true) {
            process.on('SIGTERM', () => setTimeout(() => this.stop(), 10));
        }

        if (options.stopOnSIGINT ?? true) {
            process.on('SIGINT', () => setTimeout(() => this.stop(), 10));
        }

        if (options.printUnhandledError ?? true) {
            this.on('unhandledError', (err: Error) => { print_failure('未捕获异常', err) });
        }

        if (options.stopOnUnhandledError) {
            this.on('unhandledError', () => setTimeout(() => this.stop(2), 10));
        }

        process.on('unhandledRejection', (err: unknown) => {
            this.emit('unhandledError', err instanceof Error ? err : new Error(err?.toString()));
        });

        process.on('uncaughtException', (err: unknown) => {
            this.emit('unhandledError', err instanceof Error ? err : new Error(err?.toString()));
        });

        if (process.connected) { // 健康检查
            const listener = async (message: string): Promise<void> => {
                if (message === '__health_check__') {
                    const exception = await this.healthCheck();

                    if (exception === undefined) {
                        process.send?.({
                            healthy: true,
                            managerStatue: RunningStatus[this.status] as keyof typeof RunningStatus,
                            type: 'health_check'
                        } satisfies HealthCheckResult);
                    } else {
                        process.send?.({
                            healthy: false,
                            managerStatue: RunningStatus[this.status] as keyof typeof RunningStatus,
                            moduleName: exception.module?.name,
                            description: exception.error.message,
                            type: 'health_check'
                        } satisfies HealthCheckResult);
                    }
                }
            };

            process.on('message', listener);
            process.on('disconnect', () => process.removeListener('message', listener));
        }
    }
}
