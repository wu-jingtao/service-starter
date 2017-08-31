import events = require('events');
import http = require('http');
import fs = require('fs-extra');

import { RegisteredService } from '../RegisteredService/RegisteredService';
import { log } from '../Log';
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
export class ServicesManager extends events.EventEmitter {

    //ServicesManager是否已经创建了（一个容器只允许创建一个ServicesManager）
    private static _servicesManagerCreated = false;

    /**
     * 运行状态
     */
    get status() {
        return this._status;
    }
    private _status: RunningStatus = RunningStatus.stopped;

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
            log.s1.e('程序', '出现未捕捉Promise异常：', err);

            if (config.stopOnHaveUnhandledRejection !== false) {
                //确保不会重复关闭
                if (this._status !== RunningStatus.stopping) {
                    //如果服务还未启动过
                    if (this._status === RunningStatus.stopped) {
                        process.exit(1);
                    } else {
                        this.stop(1);
                    }
                }
            }
        });

        process.on('uncaughtException', (err: Error) => {
            log.s1.e('程序', '出现未捕捉异常：', err);

            if (config.stopOnHaveUncaughtException !== false) {
                if (this._status !== RunningStatus.stopping) {
                    if (this._status === RunningStatus.stopped) {
                        process.exit(1);
                    } else {
                        this.stop(1);
                    }
                }
            }
        });

        process.on('SIGTERM', () => {
            if (config.stopOnHaveSIGTERM !== false) {
                if (this._status !== RunningStatus.stopping) {
                    if (this._status === RunningStatus.stopped) {
                        process.exit();
                    } else {
                        this.stop();
                    }
                } else {
                    console.log('正在停止程序，请稍后。。。');
                }
            }
        });

        process.on('SIGINT', () => {
            if (config.stopOnHaveSIGINT !== false) {
                if (this._status !== RunningStatus.stopping) {
                    if (this._status === RunningStatus.stopped) {
                        process.exit();
                    } else {
                        this.stop();
                    }
                } else {
                    console.log('正在停止程序，请稍后。。。');
                }
            }
        });

        //配置健康检查服务
        if (config.startHealthChecking !== false) {
            //要被监听的端口
            const port = "/tmp/service_starter_health_checking.sock";

            //删除之前的端口，避免被占用
            fs.removeSync(port);

            http.createServer(async (req, res) => {

                //服务还未处于running时直接返回成功
                if (this._status !== RunningStatus.running) return res.end('0');

                let result: [Error, RegisteredService] | undefined;

                //检查每一个服务的健康状况
                for (let item of this.services.values()) {
                    const err = await item._healthCheck();

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
                    log.s1.e('ServicesManager', '健康检查server启动失败：', err);
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
    start = () => setImmediate(this._start.bind(this)); //主要是为了等待构造函数中的事件绑定完成
    private async _start() {
        //确保只有在stopped的情况下才能执行start
        if (this._status !== RunningStatus.stopped) {
            throw new Error(
                log.s1.format(
                    `服务管理器：${this.name}`,
                    '在还未完全关闭的情况下又再次被启动。',
                    `当前的状态为：${RunningStatus[this._status]}`
                )
            );
        }

        log.s1.l(log.chalk.bold.bgMagenta(this.name), '开始启动服务');
        this._status = RunningStatus.starting;

        for (let item of this.services.values()) {
            const failed = await item._start();

            //不为空则表示启动失败
            if (failed !== undefined) {
                return this.stop(2);
            }
        }

        log.s1.l(log.chalk.bold.bgMagenta(this.name), '所有服务已启动');
        this._status = RunningStatus.running;
        this.emit('started');
    }

    /**
     * 关闭所有已启动的服务。先注册的服务最后被关闭。当所有服务都被关闭后将会退出程序。
     * 当所有服务都停止后出发stopped事件
     * 
     * @param exitCode 程序退出状态码。 1是系统错误 2用户服务错误
     */
    stop = (exitCode = 0) => setImmediate(this._stop.bind(this), exitCode);
    private async _stop(exitCode: number) {
        //确保不会重复停止
        if (this._status === RunningStatus.stopping || this._status === RunningStatus.stopped) {
            throw new Error(
                log.s1.format(
                    `服务管理器：${this.name}`,
                    '在处于正在停止或已停止的状态下又再次被停止。',
                    `当前的状态为：${RunningStatus[this._status]}`
                )
            );
        }

        log.s1.l(log.chalk.bold.bgMagenta(this.name), '开始停止服务');
        this._status = RunningStatus.stopping;

        for (let item of Array.from(this.services.values()).reverse()) {
            if (item.status !== RunningStatus.stopping && item.status !== RunningStatus.stopped)
                await item._stop();
        }

        log.s1.l(log.chalk.bold.bgMagenta(this.name), '所有服务已停止');
        this._status = RunningStatus.stopped;
        this.emit('stopped');

        //退出服务
        process.exit(exitCode);
    }

    /**
     * 注册服务
     * 
     * @param {ServiceModule} serviceModule 服务模块实例
     * @memberof ServicesManager
     */
    registerService(serviceModule: ServiceModule) {
        if (this.services.has(serviceModule.name)) {
            throw new Error(`服务：'${serviceModule.name}'已注册过了`);
        } else {
            this.services.set(serviceModule.name, new RegisteredService(serviceModule, this));
        }
    }

    /**
     * 服务运行过程中的错误处理方法。服务启动或关闭过程中产生的错误不会触发该方法。
     * 注意：onError中的代码不应出现错误，如果onError的中的代码出现错误将直接导致程序关闭。
     * 
     * @param {Error} err 
     * @param {ServiceModule} service 发生错误的服务实例
     * @memberof ServicesManager
     */
    onError(err: Error, service: ServiceModule) {
        log.s1.e(`服务：${service.name}`, '发生错误：', err);
    }
}