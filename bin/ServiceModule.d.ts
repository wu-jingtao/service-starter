/// <reference types="node" />
import events = require('events');
/**
 * Docker 容器健康检查的返回值
 *
 * @export
 * @enum {number}
 */
export declare enum HealthStatus {
    /**
     * 这个服务是健康的，可以使用
     */
    success = 0,
    /**
     * 这个服务现在不能正常工作了
     */
    unhealthy = 1,
}
/**
 * 所有服务的父类
 */
export default abstract class ServiceModule extends events.EventEmitter {
    /**
     * 启动服务
     *
     * @abstract
     * @returns {Promise<void>}
     * @memberof ServiceModule
     */
    abstract onStart(): Promise<void>;
    /**
     * 获取服务的名称（默认是类名）
     *
     * @readonly
     * @type {string}
     * @memberof ServiceModule
     */
    readonly name: string;
    /**
     * 停止服务
     *
     * @returns {Promise<void>}
     * @memberof ServiceModule
     */
    onStop(): Promise<void>;
    /**
     * 当该服务发生异常时，这个方法会在全局错误处理方法(ServicesManager的onError)之前被调用。
     * 注意该方法只有当服务在运行过程中发生错误时，该方法才会被调用。启动或停止服务过程中发生的错误，无法被该方法处理。
     * 返回false       ：错误将继续交由全局错误处理方法处理
     * 返回true        ：错误不再交由全局错误处理方法处理
     * 返回Error       ：替换错误的内容，将新的Error交由全局错误处理方法继续处理
     * 返回'stop'      ：停止所有服务的运行。
     *
     * @param {Error} err 服务产生的错误
     * @returns {(Error | boolean | string)}
     * @memberof ServiceModule
     */
    onError(err: Error): Error | boolean | string;
    /**
     * 检查当前服务工作是否正常
     *
     * @returns {Promise<HealthStatus>}
     * @memberof ServiceModule
     */
    onHealthChecking(): Promise<HealthStatus>;
}
