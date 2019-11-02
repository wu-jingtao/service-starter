import * as Emitter from 'component-emitter';
import log from 'log-formatter';
import { BaseServiceModule } from './BaseServiceModule';
import { RegisteredService } from './RegisteredService';
import { RunningStatus } from './RunningStatus';

/**
 * 服务管理器。管理所有服务的启动、停止、添加、异常处理
 */
export class BaseServicesManager extends Emitter {

    /**
     * ServicesManager是否已经创建了（一个进程只允许创建一个ServicesManager）
     */
    private static _servicesManagerCreated = false;

    /**
     * 注册的服务列表
     */
    private readonly _registeredServices = new Map<string, RegisteredService>();

    /**
     * 获取注册了的服务模块
     */
    readonly services: { [key: string]: BaseServiceModule } = new Proxy({}, {
        get: (_, property: string) => {
            const rs = this._registeredServices.get(property);
            if (rs !== undefined) return rs.service;
        },
        set() { return false }
    });

    /**
     * 运行状态
     */
    runningStatus: RunningStatus = RunningStatus.stopped;

    /**
     * BaseServicesManager 的名称，默认是类名。
     */
    get name(): string {
        return this.constructor.name;
    }

    constructor() {
        super();

        if (BaseServicesManager._servicesManagerCreated)
            throw new Error('一个进程只允许创建一个ServicesManager');

        BaseServicesManager._servicesManagerCreated = true;
    }

    /**
     * 启动所有注册的服务。按照注册的先后顺序来启动服务。先注册的服务先启动。     
     * 如果启动过程中某个服务出现异常，则后面的服务将不再被启动，之前启动过了的服务也会被依次关闭（按照从后向前的顺序关闭）。     
     * 启动结束后会触发started事件
     */
    start(): void {
        switch (this.runningStatus) {
            case RunningStatus.stopping:
                throw new Error(`服务管理器 [${this.name}] 处于正在关闭的情况下又再次被启动`);

            case RunningStatus.stopped:
                log.location.bold.bgMagenta.title.bold.blue(this.name, '开始启动');
                this.runningStatus = RunningStatus.starting;

                setTimeout(async () => { // 主要是为了等待docker构造函数中的事件绑定完成
                    for (const item of this._registeredServices.values()) {
                        if (await item.start() !== undefined) { // 不为空则表示启动失败
                            this.stop(2);
                            return;
                        }
                    }

                    log.location.bold.bgMagenta.title.bold.green(this.name, '启动成功');
                    this.runningStatus = RunningStatus.running;
                    this.emit('started');
                }, 10);
                break;
        }
    }

    /**
     * 关闭所有已启动的服务。先注册的服务最后被关闭。
     * 当所有服务都停止后出发stopped事件
     * 
     * @param exitCode 程序退出状态码。0正常退出 1是系统错误 2用户服务错误
     */
    stop(exitCode = 0): void {
        switch (this.runningStatus) {
            case RunningStatus.running:
            case RunningStatus.starting:
                log.location.bold.bgMagenta.title.bold.blue(this.name, '开始停止');
                this.runningStatus = RunningStatus.stopping;

                setTimeout(async () => {
                    for (const item of [...this._registeredServices.values()].reverse())  // 从后向前停止
                        await item.stop();

                    log.location.bold.bgMagenta.title.bold.green(this.name, '停止成功');
                    this.runningStatus = RunningStatus.stopped;
                    this.emit('stopped', exitCode);
                }, 10);
                break;
        }
    }

    /**
     * 进行健康检查。
     * 注意：如果程序的运行状态为starting，stopping，stopped，则直接将程序的运行视为健康。只有当运行状态为running时才进行健康检查。     
     * 返回 isHealth 表示是否健康 description对当前状态的额外描述
     */
    async healthCheck(): Promise<{ isHealth: boolean; description: string }> {
        const result = { isHealth: true, description: RunningStatus[this.runningStatus] };

        if (this.runningStatus === RunningStatus.running) {
            for (const item of this._registeredServices.values()) { // 检查每一个服务的健康状况
                const err = await item.healthCheck();

                if (err !== undefined) { // 不为空就表示有问题了
                    result.isHealth = false;
                    result.description = `[${item.service.name}]  ${err.message} -> \r\n ${err.stack}`;
                    break;
                }
            }
        }

        return result;
    }

    /**
     * 服务运行过程中的错误处理方法。服务启动或关闭过程中产生的错误不会触发该方法。    
     * 覆写时别忘了调用super.onError()
     * 
     * @param err 错误对象
     * @param service 发生错误的服务实例
     */
    onError(err: Error, service: BaseServiceModule): void {
        log.error
            .location.white
            .title.red
            .content.red(service.name, '发生错误：', err);
    }

    /**
     * 当出现未捕获异常时触发（包括为处理promise rejection）    
     * 覆写时别忘了调用super.onUnHandledException()
     * 
     * @param err 错误对象
     */
    onUnHandledException(err: Error): void {
        log.error
            .location.bold.bgMagenta.white
            .title.red
            .content.red(this.name, '出现未捕捉异常：', err);
    }

    /**
     * 注册服务。注册服务的名称是以类名为准
     * 
     * @param serviceModule 服务模块实例
     */
    registerService(serviceModule: BaseServiceModule): void {
        if (this._registeredServices.has(serviceModule.constructor.name))
            throw new Error(`服务模块 [${serviceModule.name}] 已注册过了`);
        else
            this._registeredServices.set(serviceModule.constructor.name, new RegisteredService(serviceModule, this));
    }

    /**
     * 程序已启动
     */
    on(event: 'started', listener: () => void): this;
    /**
     * 程序已关闭。   
     * code 退出状态码
     */
    on(event: 'stopped', listener: (code: number) => void): this;
    on(event: string, listener: Function): this {
        super.on(event, listener);
        return this;
    }

    once(event: 'started', listener: () => void): this;
    once(event: 'stopped', listener: (code: number) => void): this;
    once(event: string, listener: Function): this {
        super.once(event, listener);
        return this;
    }
}