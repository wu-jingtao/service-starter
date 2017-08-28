import { ServiceModule } from "../ServiceModule/ServiceModule";
import { ServicesManager } from "./ServicesManager";
/**
 * 保存注册了的服务。供ServicesManager使用
 *
 * @class RegisteredService
 */
export declare class RegisteredService {
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
    isStarted: boolean;
    private _isStarted;
    /**
     * 服务的名称。（这里再保存一次服务的名称是因为不允许服务名称在运行过程中被改变）
     *
     * @type {string}
     */
    readonly name: string;
    /**
     * 将要绑定在服务上的错误监听器。
     *
     * @type {Function}
     */
    readonly errorListener: Function;
    constructor(service: ServiceModule, manager: ServicesManager);
}
