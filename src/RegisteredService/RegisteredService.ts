import { ServiceModule } from "../ServiceModule/ServiceModule";
import { ServicesManager } from "../ServicesManager/ServicesManager";
import { RunningStatus } from "../RunningStatus";
import { log } from "../Log";

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
    private readonly _manager: ServicesManager;

    /**
     * 绑定在服务上的错误监听器。
     * 
     * @type {Function}
     */
    private readonly _errorListener = async (err: Error) => {
        const value = await this.service.onError(err);

        switch (value) {
            case false:
                this._manager.onError(err, this.service);
                break;
            case true:
                break;
            default:
                if (value instanceof Error)
                    this._manager.onError(value, this.service);
                break;
        }
    };

    /**
     * 服务实例
     * 
     * @type {ServiceModule}
     */
    readonly service: ServiceModule;

    /**
     * 服务的运行状态
     */
    public get status() {
        return this._status;
    }
    private _status: RunningStatus = RunningStatus.stopped;

    constructor(service: ServiceModule, manager: ServicesManager) {
        this.service = service;
        this._manager = manager;

        // 给服务绑定管理器
        this.service.servicesManager = manager;
    }

    /**
     * 启动服务。成功返回void，失败返回Error。    
     * 如果抛出异常则一定是该程序内部逻辑错误      
     * 这个方法仅供内部使用。
     * 
     * @returns {Promise<Error | void>} 
     */
    async _start(): Promise<Error | void> {
        //确保只有在stopped的情况下才能执行_start
        if (this._status !== RunningStatus.stopped) {
            throw new Error(
                log.s1.format(
                    `服务：${this.service.name}`,
                    '在还未完全关闭的情况下又再次被启动。',
                    `当前的状态为：${RunningStatus[this._status]}`
                )
            );
        }

        try {
            log.s1.l(log.chalk.blue('开始启动'), this.service.name);
            this._status = RunningStatus.starting;

            await this.service.onStart();
            this.service.on('error', this._errorListener);

            log.s1.l(log.chalk.green('成功启动'), this.service.name);
            this._status = RunningStatus.running;
        } catch (err) {
            log.s1.e(log.chalk.red('启动失败'), this.service.name, err);
            await this._stop();

            return err;
        }
    }

    /**
     * 停止服务。    
     * 如果抛出异常则一定是该程序内部逻辑错误      
     * 这个方法仅供内部使用。
     */
    async _stop() {
        //确保不会重复停止
        if (this._status === RunningStatus.stopping || this._status === RunningStatus.stopped) {
            throw new Error(
                log.s1.format(
                    `服务：${this.service.name}`,
                    '在处于正在停止或已停止的状态下又再次被停止。',
                    `当前的状态为：${RunningStatus[this._status]}`
                )
            );
        }

        try {
            log.s1.l(log.chalk.blue('开始停止'), this.service.name);
            this._status = RunningStatus.stopping;

            await this.service.onStop();

            log.s1.l(log.chalk.green('成功停止'), this.service.name);
        } catch (err) {
            log.s1.e(log.chalk.red('停止失败'), this.service.name, err);
        } finally {
            this._status = RunningStatus.stopped;
            this.service.removeListener('error', this._errorListener);
        }
    }

    /**
     * 健康检查。
     * 如果抛出异常则一定是该程序内部逻辑错误      
     * 这个方法仅供内部使用。
     * 
     * @returns {(Promise<Error | void>)} 健康检查出现的错误
     */
    async _healthCheck(): Promise<Error | void> {
        // 确保只检查运行状况下的健康状态
        if (this._status !== RunningStatus.running) {
            throw new Error(
                log.s1.format(
                    `服务：${this.service.name}`,
                    '在非运行状态下进行了健康检查。',
                    `当前的状态为：${RunningStatus[this._status]}`
                )
            );
        }

        try {
            await this.service.onHealthChecking();
        } catch (err) {
            log.s1.w(`服务：${this.service.name}`, '运行状况异常：', err);
            return err;
        }
    }
}