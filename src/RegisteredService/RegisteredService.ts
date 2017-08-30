import { ServiceModule } from "../ServiceModule/ServiceModule";
import { ServicesManager } from "../ServicesManager/ServicesManager";
import { log } from "../Log";

/**
 * 对注册了的服务进行一层封装，便于ServicesManager使用。
 * 对于注册服务的异常与状态进行处理。
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
     * 服务是否已启动
     * 
     * @type {boolean}
     */
    public get isStarted(): boolean {
        return this._isStarted;
    }
    private _isStarted: boolean = false;

    constructor(service: ServiceModule, manager: ServicesManager) {
        this.service = service;
        this._manager = manager;

        // 给服务绑定管理器
        this.service.servicesManager = manager;
    }

    /**
     * 启动服务。成功返回true，失败返回false   
     * 这个方法不会抛出异常
     * 
     * @returns {Promise<boolean>} 
     */
    async start(): Promise<boolean> {
        //确保不会重复启动
        if (this._isStarted) return true;

        try {
            log.starting('开始启动', this.service.name);
            await this.service.onStart();
            this.service.on('error', this._errorListener);
            this._isStarted = true;
            log.started('成功启动', this.service.name);

            return true;
        } catch (err) {
            log.startFailed('启动失败', this.service.name, err);
            await this.stop(true);

            return false;
        }
    }

    /**
     * 停止服务。这个方法不会抛出异常
     * 
     * @param {boolean} [force=false] 是否强制执行
     */
    async stop(force = false) {
        //确保不会重复停止
        if (force === false && this._isStarted === false) return;

        try {
            log.stopping('开始停止', this.service.name);
            await this.service.onStop();
            log.stopped('成功停止', this.service.name);
        } catch (err) {
            log.stopFailed('停止失败', this.service.name, err);
        } finally {
            this._isStarted = false;
            this.service.removeListener('error', this._errorListener);
        }
    }

    /**
     * 健康检查。这个方法不抛出异常
     * 
     * @returns {(Promise<Error | void>)} 健康检查出现的错误
     * @memberof RegisteredService
     */
    async healthCheck(): Promise<Error | void> {
        // 未启动时直接算是健康
        if (this._isStarted === false) return;

        try {
            await this.service.onHealthChecking();
        } catch (err) {
            log.w('服务', this.service.name, '的运行状况异常：', err);
            return err;
        }
    }
}