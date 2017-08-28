/// <reference types="node" />
import events = require('events');
import { HealthStatus } from "./HealthStatus";
/**
 * 所有服务的父类
 * 注意：onStart()和onStop()发生的错误，直接通过在promise中抛出错误来解决。启动之后在运行过程中出现的错误，通过this.emit('error')来处理。
 */
export declare abstract class ServiceModule extends events.EventEmitter {
    /**
     * 获取服务的名称（默认是类名）
     *
     * @readonly
     * @type {string}
     */
    readonly name: string;
    /**
     * 启动服务
     *
     * @abstract
     * @returns {Promise<void>}
     */
    abstract onStart(): Promise<void>;
    /**
     * 停止服务
     *
     * @returns {Promise<void>}
     */
    onStop(): Promise<void>;
    /**
     * 当该服务发生异常时，这个方法会在全局错误处理方法(ServicesManager的onError)之前被调用。
     * 注意该方法只有当服务在运行过程中发生错误时（通过this.emit('error')触发的错误），该方法才会被调用。
     *
     * 返回false       ：错误将继续交由全局错误处理方法处理
     * 返回true        ：错误不再交由全局错误处理方法处理
     * 返回Error       ：替换错误的内容，将新的Error交由全局错误处理方法继续处理
     * 返回'stop'      ：停止所有服务的运行。
     *
     * @param err 触发的错误对象
     */
    onError(err: Error): Promise<Error | boolean | string>;
    /**
     * 检查当前服务工作是否正常
     *
     * @returns {Promise<HealthStatus>}
     */
    onHealthChecking(): Promise<HealthStatus>;
}
