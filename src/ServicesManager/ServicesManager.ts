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

    constructor(private readonly _config: ServicesManagerConfig = {}) {
        super();

        if (ServicesManager._servicesManagerCreated) throw new Error(`${this.name}已经被创建了`);
        ServicesManager._servicesManagerCreated = true;

        process.on('unhandledRejection', (err: Error) => {
            log.s1.e('程序', '出现未捕捉Promise异常：', err);

            if (_config.stopOnHaveUnhandledRejection !== false) {
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

            if (_config.stopOnHaveUncaughtException !== false) {
                if (this._status !== RunningStatus.stopping) {
                    if (this._status === RunningStatus.stopped) {
                        process.exit(1);
                    } else {
                        this.stop(1);
                    }
                }
            }
        });

        let forceClose = false;     //用于标记是否强制退出程序
        const signalClose = () => {
            if (this._status !== RunningStatus.stopping) {
                if (this._status === RunningStatus.stopped) {
                    process.exit();
                } else {
                    this.stop();
                }
            } else {
                if (forceClose === false) {
                    console.log('正在停止程序，请稍后。。。', log.chalk.gray('（如果要强制退出，请在3秒钟之内再次点击）'));
                    forceClose = true;
                    setTimeout(function () {
                        forceClose = false;
                    }, 3000);
                } else {
                    process.exit();
                }
            }
        };

        process.on('SIGTERM', () => {
            if (_config.stopOnHaveSIGTERM !== false) {
                signalClose();
            }
        });

        process.on('SIGINT', () => {
            if (_config.stopOnHaveSIGINT !== false) {
                signalClose();
            }
        });

        //配置健康检查服务
        if (_config.startHealthChecking !== false) {
            //要被监听的端口
            const port = "/tmp/service_starter_health_checking.sock";

            //删除之前的端口，避免被占用
            fs.removeSync(port);

            http.createServer(async (req, res) => {
                if (this._status !== RunningStatus.running) {
                    //服务还未处于running时直接返回当前的状态名称
                    return res.end(RunningStatus[this._status]);
                } else {
                    let result: [Error, RegisteredService] | undefined;


                    if (result === undefined) {
                        res.end(RunningStatus[this._status]);
                    } else {
                        res.end(`[${result[1].service.name}]  ${result[0]}`);
                    }
                }
            }).listen(port, (err: Error) => {
                if (err) {
                    log.s1.e('ServicesManager', '健康检查服务器启动失败：', err);
                    process.exit(1);
                }
            });
        }
    }



    /**
     * 关闭所有已启动的服务。先注册的服务最后被关闭。当所有服务都被关闭后将会退出程序。
     * 当所有服务都停止后出发stopped事件
     * 
     * @param exitCode 程序退出状态码。 1是系统错误  2用户服务错误
     */
    stop(exitCode = 0) {
        setImmediate(this._stop.bind(this), exitCode);
    }
    private async _stop(exitCode: number) {
        //是否退出服务
        if (this._config.exitAfterStopped !== false)
            process.exit(exitCode);
    }




}