import log from 'log-formatter';
import Emitter from 'component-emitter';
import { RunningStatus } from './RunningStatus';
import type { Module } from './Module';

const print_manager_info: (name: string, description: string) => void = log.dateTime.location.bold.text.cyan.bold;
const print_manager_success: (name: string, description: string) => void = log.dateTime.location.bold.text.green.bold;
const print_manager_warning: (name: string, description: string, err: unknown) => void = log.warn.dateTime.location.bold.text.yellow.bold.linebreak;
const print_manager_failure: (name: string, description: string, err: unknown) => void = log.error.dateTime.location.bold.text.red.bold.linebreak;

const print_module_info: (name: string, description: string) => void = log.dateTime.location.text.cyan;
const print_module_success: (name: string, description: string) => void = log.dateTime.location.text.green;
const print_module_warning: (name: string, description: string, err: unknown) => void = log.warn.dateTime.location.text.yellow.linebreak;
const print_module_failure: (name: string, description: string, err: unknown) => void = log.error.dateTime.location.text.red.linebreak;

/**
 * 模块管理器配置参数
 */
export interface ModuleManagerOptions {
    /**
     * 是否打印未处理的错误信息，默认 true
     */
    printError?: boolean;
    /**
     * 是否打印健康检查异常信息，默认 true
     */
    printUnhealthy?: boolean;
    /**
     * 当触发 error 事件时，是否自动 stop(2)
     */
    stopOnError?: boolean;
    /**
     * 当触发 unhealthy 事件时，是否自动 stop(2)
     */
    stopOnUnhealthy?: boolean;
}

/**
 * 模块管理器，管理模块的添加、启动、停止、异常处理
 * @description 事件列表
 * ```typescript
 * on(event: 'started', listener: () => void): Emitter;
 * on(event: 'stopped', listener: (exitCode: number) => void): Emitter;
 * on(event: 'error', listener: (error: Error, module: Module) => void): Emitter;
 * on(event: 'unhealthy', listener: (error: Error, module: Module) => void): Emitter;
 * ```
 */
export class ModuleManager extends Emitter {
    /**
     * 模块列表
     */
    readonly modules: ReadonlyMap<string, Module> = new Map();

    /**
     * 运行状态
     */
    readonly status: RunningStatus = RunningStatus.stopped;

    /**
     * 当前模块管理器的名称（默认是类名）
     */
    get name(): string {
        return this.constructor.name;
    }

    /**
     * @param options 配置参数
     */
    constructor(options: ModuleManagerOptions = {}) {
        super();

        if (options.printError ?? true) {
            this.on('error', (err: Error, module: Module) => { print_module_failure(module.name, '发生错误', err) });
        }

        if (options.printUnhealthy ?? true) {
            this.on('unhealthy', (err: Error, module: Module) => { print_module_warning(module.name, '健康检查异常', err) });
        }

        if (options.stopOnError) {
            this.on('error', () => setTimeout(() => this.stop(2), 10));
        }

        if (options.stopOnUnhealthy) {
            this.on('unhealthy', () => setTimeout(() => this.stop(2), 10));
        }
    }

    /**
     * 启动所有模块
     * @description
     * 按照注册的先后顺序来启动，先注册的先启动。
     * 如果启动的过程中某个模块出现了异常，则后面的模块将不再被启动，之前启动过了的模块也会被依次关闭（按照从后向前的顺序关闭）。
     * 如果启动成功将触发 started 事件。
     * @returns 如果启动的过程中出现了异常，则返回一个数组，其中包含了所有的异常信息
     */
    async start(): Promise<void | { module?: Module; error: Error }[]> {
        const exceptions: { module?: Module; error: Error }[] = [];
        print_manager_info(this.name, '开始启动');

        if (this.status === RunningStatus.stopped) {
            // @ts-expect-error: 修改模块管理器运行状态
            this.status = RunningStatus.starting;

            for (const item of this.modules.values()) {
                print_module_info(item.name, '开始启动');

                if (item.status === RunningStatus.stopped) {
                    try {
                        // @ts-expect-error: 修改模块运行状态
                        item.status = RunningStatus.starting;
                        await item.onStart();
                        // @ts-expect-error: 修改模块运行状态
                        item.status = RunningStatus.running;
                        print_module_success(item.name, '启动成功');
                    } catch (err) {
                        print_module_failure(item.name, '启动失败', err);
                        exceptions.push({ module: item, error: err as Error });
                        break;
                    }
                } else {
                    const err = new Error(`模块 ${item.name} 处于 ${RunningStatus[item.status]} 的状况下又再次被 启动`);
                    print_module_failure(item.name, '启动失败', err);
                    exceptions.push({ module: item, error: err });
                    break;
                }
            }

            if (exceptions.length > 0) {
                for (const item of Array.from(this.modules.values()).reverse()) {
                    if (item.status === RunningStatus.running || item.status === RunningStatus.starting) {
                        print_module_info(item.name, '开始关闭');

                        try {
                            // @ts-expect-error: 修改模块运行状态
                            item.status = RunningStatus.stopping;
                            await item.onStop();
                            // @ts-expect-error: 修改模块运行状态
                            item.status = RunningStatus.stopped;
                            print_module_success(item.name, '关闭成功');
                        } catch (err) {
                            print_module_failure(item.name, '关闭失败', err);
                            exceptions.push({ module: item, error: err as Error });
                        }
                    }
                }

                print_manager_failure(this.name, '启动失败', undefined);
                // @ts-expect-error: 修改模块管理器运行状态
                this.status = RunningStatus.stopped;
            } else {
                print_manager_success(this.name, '启动成功');
                // @ts-expect-error: 修改模块管理器运行状态
                this.status = RunningStatus.running;
                this.emit('started');
            }
        } else {
            const err = new Error(`模块管理器 ${this.name} 处于 ${RunningStatus[this.status]} 的状况下又再次被 启动`);
            print_manager_failure(this.name, '启动失败', err);
            exceptions.push({ error: err });
        }

        return exceptions.length > 0 ? exceptions : undefined;
    }

    /**
     * 关闭所有模块
     * @description
     * 按照注册的先后顺序来关闭，后注册的先关闭。
     * 如果关闭的过程中某个模块出现了异常，后面的模块依然会继续被关闭。
     * 关闭完成后将触发 stopped 事件。
     * @param exitCode 程序退出的状态码。0 正常退出 1 是系统错误 2 用户模块错误
     * @returns 如果关闭的过程中出现了异常，则返回一个数组，其中包含了所有的异常信息
     */
    async stop(exitCode = 0): Promise<void | { module?: Module; error: Error }[]> {
        const exceptions: { module?: Module; error: Error }[] = [];
        print_manager_info(this.name, '开始关闭');

        if (this.status !== RunningStatus.running) {
            const err = new Error(`模块管理器 ${this.name} 处于 ${RunningStatus[this.status]} 的状况下又再次被 关闭`);
            print_manager_warning(this.name, '关闭异常', err);
            exceptions.push({ error: err });
        }

        // @ts-expect-error: 修改模块管理器运行状态
        this.status = RunningStatus.stopping;

        for (const item of Array.from(this.modules.values()).reverse()) {
            print_module_info(item.name, '开始关闭');

            if (item.status === RunningStatus.running || item.status === RunningStatus.starting) {
                try {
                    // @ts-expect-error: 修改模块运行状态
                    item.status = RunningStatus.stopping;
                    await item.onStop();
                    print_module_success(item.name, '关闭成功');
                    // @ts-expect-error: 修改模块运行状态
                    item.status = RunningStatus.stopped;
                } catch (err) {
                    print_module_failure(item.name, '关闭失败', err);
                    exceptions.push({ module: item, error: err as Error });
                }
            } else {
                const err = new Error(`模块 ${item.name} 处于 ${RunningStatus[item.status]} 的状况下又再次被 关闭`);
                print_module_warning(item.name, '关闭失败', err);
                exceptions.push({ module: item, error: err });
            }
        }

        print_manager_success(this.name, '关闭成功');
        // @ts-expect-error: 修改模块管理器运行状态
        this.status = RunningStatus.stopped;
        this.emit('stopped', exceptions.length > 0 ? 2 : exitCode);
        return exceptions.length > 0 ? exceptions : undefined;
    }

    /**
     * 健康检查
     * @description
     * 注意：为了符合 Docker 的健康检查策略，模块管理器的运行状态为 starting，stopping，stopped 时会直接被认为是不健康。
     * 只有当模块管理器的运行状态为 running 时才会开始健康检查，如果某个模块不健康，将触发 unhealthy(err, module) 事件。
     * @returns 如果某个模块不健康，将返回异常信息
     */
    async healthCheck(): Promise<void | { module?: Module; error: Error }> {
        if (this.status === RunningStatus.running) {
            for (const item of this.modules.values()) {
                try {
                    await item.onHealthCheck();
                } catch (err) {
                    this.emit('unhealthy', err as Error, item);
                    return { module: item, error: err as Error };
                }
            }
        } else {
            return { error: new Error(`${this.name} 尚未完全启动`) };
        }
    }

    /**
     * 注册模块
     * @param module 模块实例
     */
    registerModule(module: Module): void {
        if (this.modules.has(module.name)) {
            throw new Error(`模块 ${module.name} 已注册过了`);
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (module.manager !== undefined) {
            throw new Error(`模块 ${module.name} 已经在 ${module.manager.name} 上注册过了`);
        }

        // @ts-expect-error: 给模块绑定模块管理器
        module.manager = this;

        // 绑定在模块上的错误监听器
        module.on('error', async (err: Error): Promise<void> => {
            try {
                const value = await module.onError(err);
                if (value !== false) { this.emit('error', err, module) }
            } catch (error) {
                this.emit('error', err, module);
            }
        });

        (this.modules as Map<string, Module>).set(module.name, module);
    }
}
