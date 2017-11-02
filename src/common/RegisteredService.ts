import { BaseServiceModule } from "./BaseServiceModule";
import { BaseServicesManager } from "./BaseServicesManager";
import { RunningStatus } from "./RunningStatus";
import log from 'log-formatter';

/**
 * 对注册了的服务进行一层封装，便于ServicesManager使用。
 * 对于注册服务的生命周期进行管理。
 * 
 * @class RegisteredService
 */
export class RegisteredService {

    /**
     * 保存对服务管理器的引用
     */
    private readonly _manager: BaseServicesManager;

    /**
     * 绑定在服务模块上的错误监听器。
     * 
     * @type {Function}
     */
    private readonly _errorListener = async (errName: string | undefined, err: Error) => {
        const value = await this.service.onError(errName, err);

        switch (value) {
            case undefined:
            case null:
            case false:
                this._manager.onError(errName, err, this.service);
                break;

            case true:
                break;

            default:
                if (typeof value === 'object')
                    this._manager.onError(value.errName, value.err, this.service);
                else
                    throw new Error(`[${this.service.name}] onError的返回值类型不满足要求。实际返回的类型为:${typeof value}`);
                break;
        }
    };

    /**
     * 服务实例
     * 
     * @type {ServiceModule}
     */
    readonly service: BaseServiceModule;

    constructor(service: BaseServiceModule, manager: BaseServicesManager) {
        this.service = service;
        this._manager = manager;

        // 给服务绑定管理器
        this.service.servicesManager = manager;
    }

    /**
     * 启动服务。成功返回void，失败返回Error。    
     * 如果抛出异常则一定是service-starter的逻辑错误      
     * 这个方法仅供内部使用。
     * 
     * @returns {Promise<Error | void>} 
     */
    async start(): Promise<Error | void> {
        if (this.service.runningStatus !== RunningStatus.stopped) //确保只有在stopped的情况下才能执行start
            throw new Error(`服务：${this.service.name}在未完全关闭的情况下又再次被启动。当前的状态为：${RunningStatus[this.service.runningStatus]}`);

        try {
            log.location.title.blue(this.service.name, '开始启动');
            this.service.runningStatus = RunningStatus.starting;

            this.service.on('error', this._errorListener);
            await this.service.onStart();

            log.location.title.green(this.service.name, '启动成功');
            this.service.runningStatus = RunningStatus.running;
        } catch (err) {
            log.error
                .location.white
                .title.red
                .content.red(this.service.name, '启动失败', err);

            await this.stop();
            return err;
        }
    }

    /**
     * 停止服务。    
     * 如果抛出异常则一定是service-starter的逻辑错误      
     * 这个方法仅供内部使用。
     */
    async stop() {
        //确保不会重复停止
        if (this.service.runningStatus === RunningStatus.stopping || this.service.runningStatus === RunningStatus.stopped)
            throw new Error(`服务：${this.service.name}在处于正在停止或已停止的状态下又再次被停止。当前的状态为：${RunningStatus[this.service.runningStatus]}`);

        try {
            log.location.title.blue(this.service.name, '开始停止');
            this.service.runningStatus = RunningStatus.stopping;

            await this.service.onStop();

            log.location.title.green(this.service.name, '停止成功');
        } catch (err) {
            log.warn
                .location.white
                .title.yellow
                .content.yellow(this.service.name, '停止失败', err);
        } finally {
            this.service.runningStatus = RunningStatus.stopped;
            this.service.off('error', this._errorListener);
        }
    }

    /**
     * 健康检查。
     * 如果抛出异常则一定是service-starter的逻辑错误       
     * 这个方法仅供内部使用。
     * 
     * @returns {(Promise<Error | void>)} 健康检查出现的错误
     */
    async healthCheck(): Promise<Error | void> {
        if (this.service.runningStatus !== RunningStatus.running) // 确保只检查运行状况下的健康状态
            throw new Error(`服务：${this.service.name}在非运行状态下进行了健康检查。当前的状态为：${RunningStatus[this.service.runningStatus]}`);

        try {
            await this.service.onHealthCheck();
        } catch (err) {
            log.warn
                .location.white
                .title.yellow
                .content.yellow(`服务：${this.service.name}`, '运行状况异常：', err);
            return err;
        }
    }
}