import { BaseServiceModule } from './BaseServiceModule';
import { RegisteredService } from './RegisteredService';
import { RunningStatus } from "./RunningStatus";
import * as Emitter from 'component-emitter';
/**
 * 服务管理器。管理所有服务的启动、停止、添加、异常处理
 *
 * @export
 * @class BaseServicesManager
 * @extends {Emitter}
 */
export declare class BaseServicesManager extends Emitter {
    private static _servicesManagerCreated;
    /**
     * 注册的服务列表。(服务只应当通过registerService来进行注册)
     *
     * key是服务名称
     */
    readonly services: Map<string, RegisteredService>;
    /**
     * 运行状态
     */
    readonly status: RunningStatus;
    private _status;
    /**
     * BaseServicesManager 的名称，默认是类名。
     */
    readonly name: string;
    constructor();
    /**
     * 启动所有注册的服务。按照注册的先后顺序来启动服务。先注册的服务先启动。
     * 如果启动过程中某个服务出现异常，则后面的服务将不再被启动，之前启动过了的服务也会被依次关闭（按照从后向前的顺序关闭）。
     * 启动结束后会触发started事件
     */
    start(): void;
    /**
     * 关闭所有已启动的服务。先注册的服务最后被关闭。
     * 当所有服务都停止后出发stopped事件
     *
     * @param exitCode 程序退出状态码。0正常退出 1是系统错误  2用户服务错误
     */
    stop(exitCode?: number): void;
    /**
     * 进行健康检查。
     * 注意：如果程序的运行状态为starting，stopping，stopped，则直接将程序的运行视为健康。只有当运行状态为running时才进行健康检查。
     * 返回 isHealth 表示是否健康 description对当前状态的额外描述
     *
     * @returns {Promise<{ isHealth: boolean, description: string }>}
     * @memberof BaseServicesManager
     */
    healthCheck(): Promise<{
        isHealth: boolean;
        description: string;
    }>;
    /**
     * 服务运行过程中的错误处理方法。服务启动或关闭过程中产生的错误不会触发该方法。
     * 覆写时别忘了调用super.onError()
     *
     * @param {string | undefined} errName 错误消息的名称
     * @param {Error} err 错误对象
     * @param {ServiceModule} service 发生错误的服务实例
     * @memberof ServicesManager
     */
    onError(errName: string | undefined, err: Error, service: BaseServiceModule): void;
    /**
     * 当出现未捕获异常时触发（包括为处理promise rejection）
     * 覆写时别忘了调用super.onUnHandledException()
     *
     * @param {Error} err 错误对象
     */
    onUnHandledException(err: Error): void;
    /**
     * 注册服务。注册服务的名称是以类名为准
     *
     * @param {ServiceModule} serviceModule 服务模块实例
     * @memberof ServicesManager
     */
    registerService(serviceModule: BaseServiceModule): void;
    /**
     * 程序已启动
     */
    on(event: 'started', listener: () => any): this;
    /**
     * 程序已关闭。
     * code 退出状态码
     */
    on(event: 'stopped', listener: (code: number) => any): this;
    once(event: 'started', listener: () => any): this;
    once(event: 'stopped', listener: (code: number) => any): this;
}
