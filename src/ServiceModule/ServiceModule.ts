import events = require('events');
import { RegisteredService } from "../RegisteredService/RegisteredService";
import { ServicesManager } from "../ServicesManager/ServicesManager";


/**
 * 所有服务的父类    
 */
export abstract class ServiceModule extends events.EventEmitter {

    /**
     * 获取服务的名称（默认是类名）
     * 
     * @readonly
     * @type {string}
     */
    get name(): string {
        return this.constructor.name;
    }

    /**
     * 对于服务管理器的引用。    
     * 当服务注册之后，服务管理器会自动对该属性进行绑定
     */
    public get servicesManager(): ServicesManager {
        return this._servicesManager;
    }
    public set servicesManager(v: ServicesManager) {
        //确保只能被设置一次
        if (this._servicesManager === undefined)
            this._servicesManager = v;
    }
    private _servicesManager: ServicesManager;

    /**
     * 简化对其他注册服务的获取
     */
    readonly services: any = new Proxy(this, {
        get(target, property: string) {
            if (target._servicesManager != null) {
                const rs = target._servicesManager.services.get(property);
                if (rs !== undefined) {
                    return rs.service;
                }
            }
        }
    });

    /**
     * 启动服务
     * 注意：启动过程中出现的错误直接通过reject()来处理。
     * 启动之后(运行过程中)出现的错误，通过this.emit('error')来处理。
     * 
     * @abstract
     * @returns {Promise<void>} 
     */
    abstract onStart(): Promise<void>;

    /**
     * 停止服务
     * 注意：停止过程中出现的错误直接通过reject()来处理。
     * 
     * @returns {Promise<void>} 
     */
    onStop(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * 当该服务发生异常时，这个方法会在全局错误处理方法(ServicesManager的onError)之前被调用。    
     * 注意：该方法只有当服务在运行过程中发生错误时（通过this.emit('error')触发的错误），该方法才会被调用。
     * 注意：onError中的代码不应出现错误，如果onError的中的代码出现错误将直接导致程序关闭。
     * 
     * 返回false       ：错误将继续交由全局错误处理方法处理   
     * 返回true        ：错误不再交由全局错误处理方法处理   
     * 返回Error       ：替换错误的内容，将新的Error交由全局错误处理方法继续处理   
     * 
     * @param err 触发的错误对象
     */
    onError(err: Error): Promise<Error | boolean> {
        return Promise.resolve(false);
    }

    /**
     * 检查当前服务工作是否正常。   
     * 如果正常直接resolve()，如果出现问题直接"reject(new Error())
     * 
     * @returns {Promise<void>} 
     */
    onHealthChecking(): Promise<void> {
        return Promise.resolve();
    }
}