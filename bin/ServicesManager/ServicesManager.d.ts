/// <reference types="node" />
import events = require('events');
import { RegisteredService } from '../RegisteredService/RegisteredService';
import { ServiceModule } from "../ServiceModule/ServiceModule";
import { ServicesManagerConfig } from "./ServicesManagerConfig";
import { RunningStatus } from "../RunningStatus";
/**
 * 服务管理器
 *
 * @export
 * @class ServicesManager
 * @extends {events.EventEmitter}
 */
export declare class ServicesManager extends events.EventEmitter {
    private static _servicesManagerCreated;
    /**
     * 运行状态
     */
    readonly status: RunningStatus;
    private _status;
    /**
     * ServicesManager 的名称，默认是类名。
     */
    readonly name: string;
    /**
     * 注册的服务列表。(服务只应当通过registerService来进行注册)
     *
     * key是服务名称
     */
    readonly services: Map<string, RegisteredService>;
    constructor(config?: ServicesManagerConfig);
    /**
     * 启动所有注册的服务。按照注册的先后顺序来启动服务。先注册的服务先启动。
     * 如果启动过程中某个服务出现异常，则后面的服务则不再被启动，之前启动过了的服务也会被依次关闭（按照从后向前的顺序）。
     * 启动结束后会触发started事件
     */
    start: () => any;
    private _start();
    /**
     * 关闭所有已启动的服务。先注册的服务最后被关闭。当所有服务都被关闭后将会退出程序。
     * 当所有服务都停止后出发stopped事件
     *
     * @param exitCode 程序退出状态码。 1是系统错误
     */
    stop: (exitCode?: number) => any;
    private _stop(exitCode);
    /**
     * 注册服务
     *
     * @param {ServiceModule} serviceModule 服务模块实例
     * @memberof ServicesManager
     */
    registerService(serviceModule: ServiceModule): void;
    /**
     * 服务运行过程中的错误处理方法。服务启动或关闭过程中产生的错误不会触发该方法。
     * 注意：onError中的代码不应出现错误，如果onError的中的代码出现错误将直接导致程序关闭。
     *
     * @param {Error} err
     * @param {ServiceModule} service 发生错误的服务实例
     * @memberof ServicesManager
     */
    onError(err: Error, service: ServiceModule): void;
}
