import Emitter from 'component-emitter';
import { BaseServiceManager } from './BaseServiceManager';
import { RunningStatus } from './RunningStatus';

/**
 * 服务模块
 */
export abstract class ServiceModule extends Emitter {

    /**
     * 当前模块的服务管理器
     */
    readonly servicesManager: BaseServiceManager;

    /**
     * 当前模块的运行状态
     */
    readonly runningStatus: RunningStatus = RunningStatus.stopped;

    /**
     * 索引其他服务模块
     */
    readonly services: { [key: string]: any } = new Proxy({}, {
        get: (_, property: string) => this.servicesManager?.services[property], // eslint-disable-line
        set: () => false
    });

    /**
     * 当前服务的名称（默认是类名）
     */
    get name(): string {
        return this.constructor.name;
    }

    /**
     * 启动服务     
     * 注意：启动过程中出现的错误直接通过 Promise.reject() 来处理。
     * 启动之后(运行过程中)出现的错误，通过 this.emit('error') 来处理。
     * 尽可能多地捕捉异常，然后在onError中处理，未捕捉的异常根据平台的不同可能会导致程序直接被关闭。
     */
    abstract onStart(): Promise<void>;

    /**
     * 停止服务     
     * 注意：停止过程中出现的错误直接通过 Promise.reject() 来处理。停止过程中不要出现未捕获异常
     */
    onStop(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * 当服务发生异常时，这个方法会在全局错误处理方法( BaseServicesManager 的 onError )之前被调用。      
     * 注意：该方法只有当服务在运行过程中发生错误时（通过 this.emit('error') 触发的错误），该方法才会被调用。    
     * 
     * 返回false：错误不再交由全局错误处理方法处理   
     * 返回Error：将新的 Error 交由全局错误处理方法处理
     * 返回void： 将参数中传入的 Error 继续交给全局错误处理方法处理
     * 
     * @param err 错误消息
     */
    onError(err: Error): Promise<Error | false | void> {
        return Promise.resolve(err);
    }

    /**
     * 检查当前服务运行是否正常。   
     * 如果正常直接 Promise.resolve() ，如果出现异常直接 Promise.reject(new Error())
     */
    onHealthCheck(): Promise<void> {
        return Promise.resolve();
    }
}