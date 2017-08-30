import events = require('events');
import http = require('http');
import fs = require('fs-extra');

import { RegisteredService } from '../RegisteredService/RegisteredService';
import { log } from '../Log';
import { ServiceModule } from "../ServiceModule/ServiceModule";
import { ServicesManagerConfig } from "./ServicesManagerConfig";

/**
 * 服务管理器
 * 
 * @export
 * @class ServicesManager
 * @extends {events.EventEmitter}
 */
export class ServicesManager extends events.EventEmitter {

    //是否已经启动
    private _isStarted = false;

    //ServicesManager是否已经创建了（一个进程只允许创建一个ServicesManager）
    private static _servicesManagerCreated = false;

    /**
     * ServicesManager 的名称，默认是类名。
     */
    get name(): string {
        return this.constructor.name;
    }

    /**
     * 注册的服务列表。(服务只应当通过registerService来进行注册)
     * 
     * key是服务名称
     */
    readonly services = new Map<string, RegisteredService>()

    constructor(config: ServicesManagerConfig = {}) {
        super();

        if (ServicesManager._servicesManagerCreated) throw new Error(`${this.name}已经被创建了`);
        ServicesManager._servicesManagerCreated = true;

        process.on('unhandledRejection', (err: Error) => {
            log.e('程序出现未捕捉Promise异常：', err);

            if (config.stopOnHaveUnhandledRejection !== false) {
                this.stop(1);
            }
        });

        process.on('uncaughtException', (err: Error) => {
            log.e('程序出现未捕捉异常：', err);

            if (config.stopOnHaveUncaughtException !== false) {
                this.stop(1);
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

        //配置健康检查服务
        if (config.startHealthChecking !== false) {
            //要被监听的端口
            const port = "/tmp/service_starter_health_checking.sock";

            //删除之前的接口，避免被占用
            fs.removeSync(port);

            http.createServer(async (req, res) => {
                //log.l('接收到健康检查请求');

                let result: [Error, RegisteredService] | undefined;

                //检查每一个服务的健康状况
                for (let item of this.services.values()) {
                    const err = await item.healthCheck();

                    //不为空就表示有问题了
                    if (err !== undefined) {
                        result = [err, item];
                        break;
                    }
                }

                if (result === undefined) {
                    res.end('0');
                } else {
                    res.end(`[${result[1].service.name}]  ${result[0]}`);
                }
            }).listen(port, (err: Error) => {
                if (err) {
                    log.e(this.name, '健康检查服务启动失败：', err);
                    process.exit(1);
                }
            });
        }
    }

    /**
     * 启动所有注册的服务。按照注册的先后顺序来启动服务。先注册的服务先启动。     
     * 如果启动过程中某个服务出现异常，则后面的服务则不再被启动，之前启动过了的服务也会被依次关闭（按照从后向前的顺序）。     
     * 启动结束后会触发started事件
     */
    start() {
        //确保不会重复启动
        if (this._isStarted !== false) return;

        log.l(this.name, '开始启动服务');
        this._isStarted = true;

        (async () => {
            for (let item of this._services.values()) {
                //避免重复启动
                if (item.isStarted === true) continue;

                try {
                    log.starting('开始启动', item.name);
                    item.isStarted = true;
                    await item.service.onStart();
                    log.started('启动成功', item.name);
                } catch (error) {
                    log.startFailed('启动失败', item.name, error);
                    this.stop(1);
                    return;
                }
            }

            log.l('所有服务已启动');
            this.emit('started');
        })();
    }

    /**
     * 关闭所有已启动的服务。先注册的服务最后被关闭。当所有服务都被关闭后程序将会被退出。
     * 当所有服务都停止后出发stopped事件
     * 
     * @param exitCode 程序退出状态码。 1是系统错误 2是用户ServiceModule的onError发出的‘stop’信号
     */
    stop(exitCode = 0) {
        //确保不会重复关闭
        if (this._isStarted !== true) return;

        log.l(this.name, '开始停止服务');
        this._isStarted = false;

        (async () => {
            for (let item of Array.from(this._services.values()).reverse()) {
                //只关闭已启动了的服务
                if (item.isStarted === false) continue;

                try {
                    log.stopping('开始停止', item.name);
                    item.isStarted = false;
                    await item.service.onStop();
                    log.stopped('停止成功', item.name);
                } catch (error) {
                    log.stopFailed('停止失败', item.name, error);
                }
            }

            log.l('所有服务已停止');
            this.emit('stopped');

            //退出服务
            process.exit(exitCode);
        })();
    }

    /**
     * 注册服务
     * 
     * @param {ServiceModule} serviceModule 服务模块实例
     * @memberof ServicesManager
     */
    registerService(serviceModule: ServiceModule) {
        if (this._services.has(serviceModule.name)) {
            throw new Error(`服务'${serviceModule.name}'已注册过了`);
        } else {
            this._services.set(serviceModule.name, new RegisteredService(serviceModule, this));
        }
    }

    /**
     * 服务运行过程中的错误处理方法。服务启动或关闭过程中产生的错误不会触发该方法。
     * 
     * @param {Error} err 
     * @param {ServiceModule} service 发生错误的服务实例
     * @memberof ServicesManager
     */
    onError(err: Error, service: ServiceModule) {
        log.e(service.name, '发生错误：', err);
    }
}