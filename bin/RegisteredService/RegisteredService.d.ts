import { ServiceModule } from "../ServiceModule/ServiceModule";
import { ServicesManager } from "../ServicesManager/ServicesManager";
/**
 * 对注册了的服务进行一层封装，便于ServicesManager使用。
 * 对于注册服务的异常与状态进行处理。
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
     * 服务是否已启动
     *
     * @type {boolean}
     */
    readonly isStarted: boolean;
    private _isStarted;
    constructor(service: ServiceModule, manager: ServicesManager);
    /**
     * 启动服务。成功返回true，失败返回false
     * 这个方法不会抛出异常
     *
     * @returns {Promise<boolean>}
     */
    start(): Promise<boolean>;
    /**
     * 停止服务。这个方法不会抛出异常
     *
     * @param {boolean} [force=false] 是否强制执行
     */
    stop(force?: boolean): Promise<void>;
    /**
     * 健康检查。这个方法不抛出异常
     *
     * @returns {(Promise<Error | void>)} 健康检查出现的错误
     * @memberof RegisteredService
     */
    healthCheck(): Promise<Error | void>;
}
