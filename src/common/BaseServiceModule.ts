import { BaseServicesManager } from "./BaseServicesManager";
import { RunningStatus } from './RunningStatus';
import * as Emitter from 'component-emitter';

/**
 * 所有服务模块的父类    
 */
export abstract class BaseServiceModule extends Emitter {

    /**
     * 获取当前服务的名称（默认是类名）
     */
    get name(): string {
        return this.constructor.name;
    }

    /**
     * 当前模块的运行状态
     */
    get runningStatus(): RunningStatus {
        return this._runningStatus;
    }
    set runningStatus(v: RunningStatus) {
        this._runningStatus = v;
    }
    private _runningStatus: RunningStatus = RunningStatus.stopped;

    /**
     * 对于服务管理器的引用。    
     * 当服务注册之后，服务管理器会自动对该属性进行绑定
     */
    get servicesManager(): BaseServicesManager {
        return this._servicesManager;
    }
    set servicesManager(v: BaseServicesManager) {
        //确保只能被设置一次
        if (this._servicesManager === undefined)
            this._servicesManager = v;
        else
            throw new Error(`模块：${this.name}：不允许重复设置ServicesManager`);
    }
    private _servicesManager: BaseServicesManager;

    /**
     * 简化对其他注册服务的获取
     */
    readonly services: any = new Proxy({}, {
        get: (_, property: string) => {
            if (this._servicesManager !== undefined) {
                const rs = this._servicesManager.services.get(property);
                if (rs !== undefined)
                    return rs.service;
            }
        }
    });

    /**
     * 启动服务     
     * 注意：启动过程中出现的错误直接通过Promise.reject()来处理。
     * 启动之后(运行过程中)出现的错误，通过this.emit('error')来处理。
     * 尽可能多地捕捉异常，然后在onError中处理，未捕捉的异常根据平台的不同可能会导致程序直接被关闭。
     * 
     * @abstract
     * @returns {Promise<void>} 
     */
    abstract onStart(): Promise<void>;

    /**
     * 停止服务     
     * 注意：停止过程中出现的错误直接通过Promise.reject()来处理。停止过程中不要出现未捕获异常
     * 
     * @returns {Promise<void>} 
     */
    onStop(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * 当服务发生异常时，这个方法会在全局错误处理方法(BaseServicesManager的onError)之前被调用。      
     * 注意：该方法只有当服务在运行过程中发生错误时（通过this.emit('error')触发的错误），该方法才会被调用。    
     * 
     * 返回false、undefined或null                     ：错误将继续交由全局错误处理方法处理   
     * 返回true                                       ：错误不再交由全局错误处理方法处理   
     * 返回{errName: string | undefined, err: Error}  ：替换错误的内容，将新的Error交由全局错误处理方法继续处理   
     * 
     * @param errName 错误消息的名称
     * @param err 错误消息
     */
    onError(errName: string | undefined, err: Error): Promise<{ errName: string | undefined, err: Error } | boolean | void> {
        return Promise.resolve();
    }

    /**
     * 检查当前服务运行是否正常。   
     * 如果正常直接Promise.resolve()，如果出现问题直接Promise.reject(new Error())
     * 
     * @returns {Promise<void>} 
     */
    onHealthCheck(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * 模块运行过程中发生的从错误
     */
    on(event: 'error', listener: (errName: string | undefined, err: Error) => any): this;
    on(event: string, listener: Function): this {
        super.on(event, listener);
        return this;
    }

    once(event: 'error', listener: (errName: string | undefined, err: Error) => any): this;
    once(event: string, listener: Function): this {
        super.once(event, listener);
        return this;
    }

    /**
     * 触发错误事件。并设置错误事件的errName为undefined
     * 
     * @param {'error'} event 
     * @param {Error} err 错误消息
     * @returns {boolean} 
     * @memberof BaseServiceModule
     */
    emit(event: 'error', err: Error): this;
    /**
     * 触发错误事件。
     * 
     * @param {'error'} event 
     * @param {string} errName 错误消息的名称
     * @param {Error} err 错误消息
     * @returns {boolean} 
     * @memberof BaseServiceModule
     */
    emit(event: 'error', errName: string, err: Error): this;
    emit(event: string, ...args: any[]): this {
        if (event === 'error') {
            let errName, err;
            if (args[0] instanceof Error) {
                err = args[0];
            } else {
                errName = args[0];
                err = args[1];
            }
            return super.emit(event, errName, err) as this;
        } else {
            return super.emit(event, ...args) as this;
        }
    }
}