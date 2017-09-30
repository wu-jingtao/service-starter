import { BaseServiceModule } from './BaseServiceModule';
import { RegisteredService } from './RegisteredService';
import { RunningStatus } from "./RunningStatus";
import log from 'log-formatter';
import * as Emitter from 'component-emitter';

/**
 * 服务管理器。管理所有服务的启动、停止、添加注册、异常处理
 * 
 * @export
 * @class BaseServicesManager
 * @extends {Emitter}
 */
export class BaseServicesManager extends Emitter {

    //ServicesManager是否已经创建了（一个进程只允许创建一个ServicesManager）
    private static _servicesManagerCreated = false;

    /**
     * 注册的服务列表。(服务只应当通过registerService来进行注册)
     * 
     * key是服务名称
     */
    readonly services = new Map<string, RegisteredService>();

    /**
     * 运行状态
     */
    get status() {
        return this._status;
    }
    private _status: RunningStatus = RunningStatus.stopped;

    /**
     * BaseServicesManager 的名称，默认是类名。
     */
    get name(): string {
        return this.constructor.name;
    }

    constructor() {
        super();

        if (BaseServicesManager._servicesManagerCreated)
            throw new Error(`一个进程只允许创建一个ServicesManager。${this.name}已经被创建了`);

        BaseServicesManager._servicesManagerCreated = true;
    }

    /**
     * 启动所有注册的服务。按照注册的先后顺序来启动服务。先注册的服务先启动。     
     * 如果启动过程中某个服务出现异常，则后面的服务将不再被启动，之前启动过了的服务也会被依次关闭（按照从后向前的顺序关闭）。     
     * 启动结束后会触发started事件
     */
    start() {
        if (this._status !== RunningStatus.stopped)  //确保只有在stopped的情况下才能执行start
            throw new Error(`[${this.name}] 在还未完全关闭的情况下又再次被启动。当前的状态为：${RunningStatus[this._status]}`);

        log.location.bold.bgMagenta.title.bold.blue(this.name, '开始启动');
        this._status = RunningStatus.starting;

        setTimeout(async () => { //主要是为了等待构造函数中的事件绑定完成
            for (let item of this.services.values()) {
                //如果启动过程中出现了异常则就不再向下启动了（因为出现了异常之后_status或变为stopping）
                if (this._status !== RunningStatus.starting) return;

                //不为空则表示启动失败
                if (await item.start() !== undefined) {
                    return this.stop(2);
                }
            }

            log.location.bold.bgMagenta.title.bold.green(this.name, '启动成功');
            this._status = RunningStatus.running;
            this.emit('started');
        }, 0);
    }

    /**
     * 关闭所有已启动的服务。先注册的服务最后被关闭。
     * 当所有服务都停止后出发stopped事件
     * 
     * @param exitCode 程序退出状态码。0正常退出 1是系统错误  2用户服务错误
     */
    stop(exitCode = 0) {
        //确保不会重复停止
        if (this._status === RunningStatus.stopping || this._status === RunningStatus.stopped)
            throw new Error(`[${this.name}] 在处于正在停止或已停止的状态下又再次被停止。当前的状态为：${RunningStatus[this._status]}`);

        log.location.bold.bgMagenta.title.bold.blue(this.name, '开始停止');
        this._status = RunningStatus.stopping;

        setTimeout(async () => {
            for (let item of [...this.services.values()].reverse()) {
                if (item.service.runningStatus !== RunningStatus.stopping && item.service.runningStatus !== RunningStatus.stopped)
                    await item.stop();
            }

            log.location.bold.bgMagenta.title.bold.green(this.name, '停止成功');
            this._status = RunningStatus.stopped;
            this.emit('stopped');
        }, 0);
    }

    /**
     * 进行健康检查。
     * 注意：如果程序的运行状态为starting，stopping，stopped，则会直接将程序的运行视为健康。     
     * 返回 starting，stopping，stopped，running 则表示健康，否则表示不健康
     * @returns {(Promise<[string>)} 
     * @memberof BaseServicesManager
     */
    async healthCheck(): Promise<string> {
        //服务还未处于running时直接返回状态文字
        if (this._status !== RunningStatus.running)
            return RunningStatus[this._status];

        let result: [Error, BaseServiceModule] | undefined;

        //检查每一个服务的健康状况
        for (let item of this.services.values()) {
            const err = await item.healthCheck();
            //不为空就表示有问题了
            if (err !== undefined) {
                result = [err, item.service];
                break;
            }
        }

        if (result === undefined) {
            return RunningStatus[this._status];
        } else {
            return `[${result[1].name}]  ${result[0]}`;
        }
    }

    /**
     * 服务运行过程中的错误处理方法。服务启动或关闭过程中产生的错误不会触发该方法。    
     * 覆写时别忘了调用super.onError()
     * 
     * @param {string | undefined} errName 错误消息的名称
     * @param {Error} err 错误对象
     * @param {ServiceModule} service 发生错误的服务实例
     * @memberof ServicesManager
     */
    onError(errName: string | undefined, err: Error, service: BaseServiceModule) {
        log.error
            .location.white
            .title.red
            .text.red
            .content.red(service.name, '发生错误：', errName, err);
    }

    /**
     * 当出现未捕获异常时触发（包括为处理promise rejection）    
     * 覆写时别忘了调用super.onUnHandledException()
     * 
     * @param {Error} err 错误对象
     */
    onUnHandledException(err: Error) {
        log.error
            .location.white.bold
            .title.red
            .content.red(this.name, '出现未捕捉异常：', err);
    }

    /**
     * 注册服务。注册服务的名称是以类名为准
     * 
     * @param {ServiceModule} serviceModule 服务模块实例
     * @memberof ServicesManager
     */
    registerService(serviceModule: BaseServiceModule) {
        if (this.services.has(serviceModule.constructor.name)) {
            throw new Error(`服务：'${serviceModule.name}'已注册过了`);
        } else {
            this.services.set(serviceModule.constructor.name, new RegisteredService(serviceModule, this));
        }
    }

    /**
     * 程序已启动
     */
    on(event: 'started', listener: () => any): this;
    /**
     * 程序已关闭
     */
    on(event: 'stopped', listener: () => any): this;
    on(event: string, listener: Function): this {
        super.on(event, listener);
        return this;
    }


    once(event: 'started', listener: () => any): this;
    once(event: 'stopped', listener: () => any): this;
    once(event: string, listener: Function): this {
        super.once(event, listener);
        return this;
    }
}