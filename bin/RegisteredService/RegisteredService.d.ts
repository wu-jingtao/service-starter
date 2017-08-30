import { ServiceModule } from "../ServiceModule/ServiceModule";
import { ServicesManager } from "../ServicesManager/ServicesManager";
import { RunningStatus } from "../RunningStatus";
/**
 * 对注册了的服务进行一层封装，便于ServicesManager使用。
 * 对于注册服务的生命周期进行管理。
 *
 * @class RegisteredService
 */
export declare class RegisteredService {
    /**
     * 保存对服务管理器的引用
     */
    private readonly _manager;
    /**
     * 绑定在服务上的错误监听器。
     *
     * @type {Function}
     */
    private readonly _errorListener;
    /**
     * 服务实例
     *
     * @type {ServiceModule}
     */
    readonly service: ServiceModule;
    /**
     * 服务的运行状态
     */
    readonly status: RunningStatus;
    private _status;
    constructor(service: ServiceModule, manager: ServicesManager);
    /**
     * 启动服务。成功返回void，失败返回Error。
     * 如果抛出异常则一定是该程序内部逻辑错误
     * 这个方法仅供内部使用。
     *
     * @returns {Promise<Error | void>}
     */
    _start(): Promise<Error | void>;
    /**
     * 停止服务。
     * 如果抛出异常则一定是该程序内部逻辑错误
     * 这个方法仅供内部使用。
     */
    _stop(): Promise<void>;
    /**
     * 健康检查。
     * 如果抛出异常则一定是该程序内部逻辑错误
     * 这个方法仅供内部使用。
     *
     * @returns {(Promise<Error | void>)} 健康检查出现的错误
     */
    _healthCheck(): Promise<Error | void>;
}
