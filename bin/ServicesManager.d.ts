/// <reference types="node" />
import events = require('events');
import { ServiceModule } from "./ServiceModule";
/**
 * ServicesManager配置
 *
 * @export
 * @interface ServicesManagerConfig
 */
export interface ServicesManagerConfig {
    /**
     * 当有未捕获异常的Promise产生时是否停止服务(默认true,停止)
     *
     * @type {boolean}
     * @memberof ServicesManagerConfig
     */
    stopOnHaveUnhandledRejection?: boolean;
    /**
     * 当有未捕获异常产生时是否停止服务(默认true,停止)
     *
     * @type {boolean}
     * @memberof ServicesManagerConfig
     */
    stopOnHaveUncaughtException?: boolean;
    /**
     * 当收到SIGTERM信号时是否停止服务(默认true,停止)
     *
     * @type {boolean}
     * @memberof ServicesManagerConfig
     */
    stopOnHaveSIGTERM?: boolean;
    /**
    * 当收到SIGINT信号时是否停止服务(默认true,停止)
    *
    * @type {boolean}
    * @memberof ServicesManagerConfig
    */
    stopOnHaveSIGINT?: boolean;
    /**
     * 是否启动健康检查(默认true,启动)
     *
     * @type {boolean}
     * @memberof ServicesManagerConfig
     */
    startHealthChecking?: boolean;
}
/**
 * 保存注册了的服务
 *
 * @class _Services
 */
export declare class _Services {
    /**
     * 服务实例
     *
     * @type {ServiceModule}
     * @memberof _Services
     */
    readonly service: ServiceModule;
    /**
     * 服务是否已启动
     *
     * @type {boolean}
     * @memberof _Services
     */
    isStarted: boolean;
    /**
     * 服务的名称。（这里再保存一次服务的名称是因为不允许服务名称在运行过程中被改变）
     *
     * @type {string}
     * @memberof _Services
     */
    readonly name: string;
    /**
     * 绑定在服务上的错误监听器。用于之后删除监听器时使用
     *
     * @type {Function}
     * @memberof _Services
     */
    errorListener: Function;
    constructor(service: ServiceModule);
}
export declare class ServicesManager extends events.EventEmitter {
    private _isStarted;
    private static _servicesManagerCreated;
    /**
     * ServicesManager 的名称，默认是类名。
     */
    readonly name: string;
    /**
     * 注册的服务。(服务只应当通过registerService来进行注册)
     */
    readonly _services: _Services[];
    constructor(config?: ServicesManagerConfig);
    /**
     * 启动所有注册的服务。按照注册的先后顺序来启动服务。先注册的服务先启动。
     * 如果启动过程中某个服务出现异常，则后面的服务则不再被启动，之前启动过了的服务也会被依次关闭（按照从后向前的顺序）。
     * 启动结束后会触发started事件
     *
     * @memberof ServicesManager
     */
    start(): void;
    /**
     * 关闭所有已启动的服务。先注册的服务最后被关闭。当所有服务都被关闭后程序将会被退出。
     * 当所有服务都停止后出发stopped事件
     *
     * @param exitCode 程序退出状态码。 1是未捕捉的系统错误 2是用户ServiceModule的onError发出的‘stop’信号
     */
    stop(exitCode?: number): void;
    /**
     * 注册服务
     *
     * @param {ServiceModule} serviceModule 服务模块实例
     * @memberof ServicesManager
     */
    registerService(serviceModule: ServiceModule): void;
    /**
     * 服务运行过程中的错误处理方法。服务启动或关闭过程中产生的错误不会触发该方法。
     *
     * @param {Error} err
     * @param {ServiceModule} service 发生错误的服务实例
     * @memberof ServicesManager
     */
    onError(err: Error, service: ServiceModule): void;
}
