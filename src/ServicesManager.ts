import log from './Log';
import events = require('events');
import ServiceModule from "./ServiceModule";

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
}

/**
 * 保存注册了的服务
 * 
 * @class _Services
 */
class _Services {
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
    isStarted = false;

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

    constructor(service: ServiceModule) {
        this.service = service;
        this.name = service.name;
    }
}

export default class ServicesManager extends events.EventEmitter {

    private _isStarted = false;    //是否已经启动
    private static _servicesManagerCreated = false; //ServicesManager是否已经创建了（一个进程只允许创建一个ServicesManager）
    private readonly _services: _Services[] = [];   //注册的服务

    constructor(config: ServicesManagerConfig = {}) {
        super();

        if (ServicesManager._servicesManagerCreated) throw new Error('ServicesManager已经被创建了');
        ServicesManager._servicesManagerCreated = true;

        process.on('unhandledRejection', (err: Error) => {
            log.e('程序出现未捕捉Promise异常', err);

            if (config.stopOnHaveUnhandledRejection !== false) {
                this.stop();
            }
        });

        process.on('uncaughtException', (err: Error) => {
            log.e('程序出现未捕捉异常', err);

            if (config.stopOnHaveUncaughtException !== false) {
                this.stop();
            }
        });

        process.on('SIGTERM', () => {
            if (config.stopOnHaveSIGTERM !== false) {
                this.stop();
            }
        });

        process.on('SIGINT', () => {
            if (config.stopOnHaveSIGINT !== false) {
                this.stop();
            }
        });
    }

    /**
     * 启动所有注册的服务。按照注册的先后顺序来启动服务。先注册的服务先启动。
     * 如果启动过程中某个服务出现异常，则后面的服务则不再被启动，之前启动过了的服务也会被依次关闭（按照从后向前的顺序）。
     * 启动结束后会触发started事件
     * 
     * @memberof ServicesManager
     */
    start() {
        if (this._isStarted === false) {

            log.l('开始启动服务');
            this._isStarted = true;

            (async () => {
                for (let item of this._services) {
                    try {
                        item.isStarted = true;
                        await item.service.onStart();
                        //绑定错误处理器
                        item.service.on('error', item.errorListener);
                        log.l(item.name, '[启动成功]');
                    } catch (error) {
                        log.e('启动', item.name, '时出现异常：', error);
                        this.stop();
                        return;
                    }
                }

                log.l('所有服务已启动');
                this.emit('started');
            })();
        }
    }

    /**
     * 关闭所有已启动的服务。先注册的服务最后被关闭。当所有服务都被关闭后程序将会被退出。
     * 当所有服务都停止后出发stopped事件
     * 
     * @memberof ServicesManager
     */
    stop() {
        if (this._isStarted === true) {
            log.l('开始停止服务');
            this._isStarted = false;

            (async () => {
                for (let item of this._services.reverse()) {
                    if (item.isStarted) {   //只关闭已启动了的服务
                        try {
                            item.isStarted = false;
                            await item.service.onStop();
                            //清除绑定的错误监听器
                            item.service.removeListener('error', item.errorListener);
                            log.l(item.name, '[停止成功]');
                        } catch (error) {
                            log.w('停止', item.name, '时出现异常：', error);
                        }
                    }
                }

                log.l('所有服务已停止');
                this.emit('stopped');
            })();
        }
    }

    /**
     * 注册服务
     * 
     * @param {ServiceModule} serviceModule 服务模块实例
     * @memberof ServicesManager
     */
    registerService(serviceModule: ServiceModule) {
        if (this._services.some(item => item.name == serviceModule.name)) {
            throw new Error(`服务'${serviceModule.name}'已注册过了`);
        } else {
            const service = new _Services(serviceModule);

            //创建服务运行时错误监听器
            service.errorListener = (err: Error) => {
                const value = service.service.onError(err);
                switch (value) {
                    case false:
                        this.onError(serviceModule, err);
                        break;
                    case true:
                        break;
                    case 'stop':
                        this.onError(serviceModule, err);
                        this.stop();
                        break;
                    default:
                        if (value instanceof Error)
                            this.onError(serviceModule, value);
                        break;
                }
            };

            this._services.push(service);
        }
    }

    protected onHealthChecking() {

    }

    protected onError(service: ServiceModule, err: Error) {
        log.e(service.name, '发生错误：', err);
    }
}