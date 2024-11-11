import Emitter from 'component-emitter';
import { RunningStatus } from './RunningStatus';
import type { ModuleManager } from './ModuleManager';

/**
 * 模块
 * @description 事件列表
 * ```typescript
 * on(event: 'error', listener: (error: Error) => void): Emitter
 * ```
 */
export abstract class Module extends Emitter {
    /**
     * 模块管理器
     */
    readonly manager!: ModuleManager;

    /**
     * 索引其他模块
     */
    readonly modules: Record<string, Module | undefined> = new Proxy({}, {
        get: (_, property: string) => this.manager.modules.get(property),
        set: () => { throw new Error('modules 不可以设置') }
    });

    /**
     * 当前模块的运行状态
     */
    readonly status: RunningStatus = RunningStatus.stopped;

    /**
     * 当前模块的名称（默认是类名）
     */
    get name(): string {
        return this.constructor.name;
    }

    /**
     * 模块启动时要执行的代码
     * @description
     * 注意：启动过程中出现的错误要通过 Promise.reject() 来处理。
     * 启动之后(运行过程中)出现的错误，要通过 this.emit('error') 来处理。
     * 尽可能多地捕捉异常，然后在 onError 中处理，未捕捉到的异常根据平台的不同可能会导致程序直接被关闭。
     */
    abstract onStart(): Promise<void>; // eslint-disable-line @typescript-eslint/member-ordering

    /**
     * 模块停止时要执行的代码
     * @description
     * 注意：停止过程中出现的错误要通过 Promise.reject() 来处理。
     */
    async onStop(): Promise<void> { } // eslint-disable-line @typescript-eslint/no-empty-function

    /**
     * 检查当前模块的运行是否正常（只有模块处于 Running 状态时才会被调用）
     * @description
     * 如果正常直接 Promise.resolve() ，如果异常直接 Promise.reject()
     */
    async onHealthCheck(): Promise<void> { } // eslint-disable-line @typescript-eslint/no-empty-function

    /**
     * 模块出现异常时要执行的代码
     * @description
     * 当模块发生异常时，该方法会在 ModuleManager 的 on('error') 之前被调用。
     * 注意：该方法只处理模块在运行过程中发生错误（通过 this.emit('error') 触发的错误）。
     * @param err 错误消息
     * @returns
     * 返回 false：错误将不再传递给 ModuleManager。
     *
     * 返回 undefined：错误将触发 ModuleManager 的 error 事件。
     * @throws 新的 Error 将触发 ModuleManager 的 error 事件。
     */
    async onError(err: Error): Promise<false | void> { } // eslint-disable-line @typescript-eslint/no-empty-function

    override emit(event: 'error', error: Error): this;
    override emit(event: string, ...args: any[]): this;
    override emit(event: string, ...args: any[]): this {
        if (event === 'error' && this.status !== RunningStatus.running) {
            throw new Error(`禁止模块的状态为 ${RunningStatus[this.status]} 时通过 emit("error") 抛出异常`);
        } else {
            super.emit(event, ...args);
            return this;
        }
    }
}
