import * as Emitter from 'component-emitter';
import { BaseServicesManager } from './BaseServicesManager';
import { RunningStatus } from './RunningStatus';

/**
 * 所有服务模块的父类    
 */
export abstract class BaseServiceModule extends Emitter {

    private _servicesManager: BaseServicesManager;

    /**
     * 其他服务模块
     */
    readonly services: any = new Proxy({}, {
        get: (_, property: string) => {
            if (this._servicesManager !== undefined)
                return this._servicesManager.services[property];
        },
        set() { return false }
    });

    /**
     * 当前模块的运行状态
     */
    runningStatus: RunningStatus = RunningStatus.stopped;

    /**
     * 获取当前服务的名称（默认是类名）
     */
    get name(): string {
        return this.constructor.name;
    }

    /**
     * 对于服务管理器的引用。    
     * 当服务注册之后，服务管理器会自动对该属性进行绑定
     */
    get servicesManager(): BaseServicesManager {
        return this._servicesManager;
    }
    set servicesManager(v: BaseServicesManager) {
        // 确保只能被设置一次
        if (this._servicesManager === undefined)
            this._servicesManager = v;
        else
            throw new Error(`服务模块：${this.name}：不允许重复设置ServicesManager`);
    }

    /**
     * 启动服务     
     * 注意：启动过程中出现的错误直接通过Promise.reject()来处理。
     * 启动之后(运行过程中)出现的错误，通过this.emit('error')来处理。
     * 尽可能多地捕捉异常，然后在onError中处理，未捕捉的异常根据平台的不同可能会导致程序直接被关闭。
     */
    abstract onStart(): Promise<void>;

    /**
     * 停止服务     
     * 注意：停止过程中出现的错误直接通过Promise.reject()来处理。停止过程中不要出现未捕获异常
     */
    onStop(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * 当服务发生异常时，这个方法会在全局错误处理方法(BaseServicesManager的onError)之前被调用。      
     * 注意：该方法只有当服务在运行过程中发生错误时（通过this.emit('error')触发的错误），该方法才会被调用。    
     * 
     * 返回false：错误不再交由全局错误处理方法处理   
     * 返回Error：将Error交由全局错误处理方法处理
     * 
     * @param err 错误消息
     */
    onError(err: Error): Promise<Error | false> {
        return Promise.resolve(err);
    }

    /**
     * 检查当前服务运行是否正常。   
     * 如果正常直接Promise.resolve()，如果出现异常直接Promise.reject(new Error())
     */
    onHealthCheck(): Promise<void> {
        return Promise.resolve();
    }
}