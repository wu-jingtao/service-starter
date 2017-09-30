import { BaseServiceModule } from "./BaseServiceModule";
import { BaseServicesManager } from "./BaseServicesManager";
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
     * 绑定在服务模块上的错误监听器。
     *
     * @type {Function}
     */
    private readonly _errorListener;
    /**
     * 服务实例
     *
     * @type {ServiceModule}
     */
    readonly service: BaseServiceModule;
    constructor(service: BaseServiceModule, manager: BaseServicesManager);
    /**
     * 启动服务。成功返回void，失败返回Error。
     * 如果抛出异常则一定是service-starter的逻辑错误
     * 这个方法仅供内部使用。
     *
     * @returns {Promise<Error | void>}
     */
    start(): Promise<Error | void>;
    /**
     * 停止服务。
     * 如果抛出异常则一定是service-starter的逻辑错误
     * 这个方法仅供内部使用。
     */
    stop(): Promise<void>;
    /**
     * 健康检查。
     * 如果抛出异常则一定是service-starter的逻辑错误
     * 这个方法仅供内部使用。
     *
     * @returns {(Promise<Error | void>)} 健康检查出现的错误
     */
    healthCheck(): Promise<Error | void>;
}
