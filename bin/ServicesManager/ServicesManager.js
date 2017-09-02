"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events = require("events");
const http = require("http");
const fs = require("fs-extra");
const RegisteredService_1 = require("../RegisteredService/RegisteredService");
const Log_1 = require("../Log");
const RunningStatus_1 = require("../RunningStatus");
/**
 * 服务管理器
 *
 * @export
 * @class ServicesManager
 * @extends {events.EventEmitter}
 */
class ServicesManager extends events.EventEmitter {
    constructor(_config = {}) {
        super();
        this._config = _config;
        this._status = RunningStatus_1.RunningStatus.stopped;
        /**
         * 注册的服务列表。(服务只应当通过registerService来进行注册)
         *
         * key是服务名称
         */
        this.services = new Map();
        /**
         * 启动所有注册的服务。按照注册的先后顺序来启动服务。先注册的服务先启动。
         * 如果启动过程中某个服务出现异常，则后面的服务则不再被启动，之前启动过了的服务也会被依次关闭（按照从后向前的顺序）。
         * 启动结束后会触发started事件
         */
        this.start = () => setImmediate(this._start.bind(this)); //主要是为了等待构造函数中的事件绑定完成
        /**
         * 关闭所有已启动的服务。先注册的服务最后被关闭。当所有服务都被关闭后将会退出程序。
         * 当所有服务都停止后出发stopped事件
         *
         * @param exitCode 程序退出状态码。 1是系统错误  2用户服务错误
         */
        this.stop = (exitCode = 0) => setImmediate(this._stop.bind(this), exitCode);
        if (ServicesManager._servicesManagerCreated)
            throw new Error(`${this.name}已经被创建了`);
        ServicesManager._servicesManagerCreated = true;
        process.on('unhandledRejection', (err) => {
            Log_1.log.s1.e('程序', '出现未捕捉Promise异常：', err);
            if (_config.stopOnHaveUnhandledRejection !== false) {
                //确保不会重复关闭
                if (this._status !== RunningStatus_1.RunningStatus.stopping) {
                    //如果服务还未启动过
                    if (this._status === RunningStatus_1.RunningStatus.stopped) {
                        process.exit(1);
                    }
                    else {
                        this.stop(1);
                    }
                }
            }
        });
        process.on('uncaughtException', (err) => {
            Log_1.log.s1.e('程序', '出现未捕捉异常：', err);
            if (_config.stopOnHaveUncaughtException !== false) {
                if (this._status !== RunningStatus_1.RunningStatus.stopping) {
                    if (this._status === RunningStatus_1.RunningStatus.stopped) {
                        process.exit(1);
                    }
                    else {
                        this.stop(1);
                    }
                }
            }
        });
        let forceClose = false; //用于标记是否强制退出程序
        const signalClose = () => {
            if (this._status !== RunningStatus_1.RunningStatus.stopping) {
                if (this._status === RunningStatus_1.RunningStatus.stopped) {
                    process.exit();
                }
                else {
                    this.stop();
                }
            }
            else {
                if (forceClose === false) {
                    console.log('正在停止程序，请稍后。。。', Log_1.log.chalk.gray('（如果要强制退出，请在3秒钟之内再次点击）'));
                    forceClose = true;
                    setTimeout(function () {
                        forceClose = false;
                    }, 3000);
                }
                else {
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
                if (this._status !== RunningStatus_1.RunningStatus.running) {
                    //服务还未处于running时直接返回当前的状态名称
                    return res.end(RunningStatus_1.RunningStatus[this._status]);
                }
                else {
                    let result;
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
                        res.end(RunningStatus_1.RunningStatus[this._status]);
                    }
                    else {
                        res.end(`[${result[1].service.name}]  ${result[0]}`);
                    }
                }
            }).listen(port, (err) => {
                if (err) {
                    Log_1.log.s1.e('ServicesManager', '健康检查服务器启动失败：', err);
                    process.exit(1);
                }
            });
        }
    }
    /**
     * 运行状态
     */
    get status() {
        return this._status;
    }
    /**
     * ServicesManager 的名称，默认是类名。
     */
    get name() {
        return this.constructor.name;
    }
    async _start() {
        //确保只有在stopped的情况下才能执行start
        if (this._status !== RunningStatus_1.RunningStatus.stopped) {
            throw new Error(Log_1.log.s1.format(`服务管理器：${this.name}`, '在还未完全关闭的情况下又再次被启动。', `当前的状态为：${RunningStatus_1.RunningStatus[this._status]}`));
        }
        Log_1.log.s1.l(Log_1.log.chalk.bold.bgMagenta(this.name), '开始启动服务');
        this._status = RunningStatus_1.RunningStatus.starting;
        for (let item of this.services.values()) {
            //如果启动过程中出现了异常则就不再向下启动了（因为出现了异常之后_status或变为stopping）
            if (this._status !== RunningStatus_1.RunningStatus.starting)
                return;
            const failed = await item._start();
            //不为空则表示启动失败
            if (failed !== undefined) {
                return this.stop(2);
            }
        }
        Log_1.log.s1.l(Log_1.log.chalk.bold.bgMagenta(this.name), '所有服务已启动');
        this._status = RunningStatus_1.RunningStatus.running;
        this.emit('started');
    }
    async _stop(exitCode) {
        //确保不会重复停止
        if (this._status === RunningStatus_1.RunningStatus.stopping || this._status === RunningStatus_1.RunningStatus.stopped) {
            throw new Error(Log_1.log.s1.format(`服务管理器：${this.name}`, '在处于正在停止或已停止的状态下又再次被停止。', `当前的状态为：${RunningStatus_1.RunningStatus[this._status]}`));
        }
        Log_1.log.s1.l(Log_1.log.chalk.bold.bgMagenta(this.name), '开始停止服务');
        this._status = RunningStatus_1.RunningStatus.stopping;
        for (let item of Array.from(this.services.values()).reverse()) {
            if (item.status !== RunningStatus_1.RunningStatus.stopping && item.status !== RunningStatus_1.RunningStatus.stopped)
                await item._stop();
        }
        Log_1.log.s1.l(Log_1.log.chalk.bold.bgMagenta(this.name), '所有服务已停止');
        this._status = RunningStatus_1.RunningStatus.stopped;
        this.emit('stopped');
        //是否退出服务
        if (this._config.exitAfterStopped !== false)
            process.exit(exitCode);
    }
    /**
     * 注册服务。注册服务的名称是以类名为准
     *
     * @param {ServiceModule} serviceModule 服务模块实例
     * @memberof ServicesManager
     */
    registerService(serviceModule) {
        if (this.services.has(serviceModule.constructor.name)) {
            throw new Error(`服务：'${serviceModule.name}'已注册过了`);
        }
        else {
            this.services.set(serviceModule.constructor.name, new RegisteredService_1.RegisteredService(serviceModule, this));
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
    onError(err, service) {
        Log_1.log.s1.e(`服务：${service.name}`, '发生错误：', err);
    }
}
//ServicesManager是否已经创建了（一个容器只允许创建一个ServicesManager）
ServicesManager._servicesManagerCreated = false;
exports.ServicesManager = ServicesManager;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VzTWFuYWdlci9TZXJ2aWNlc01hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBa0M7QUFDbEMsNkJBQThCO0FBQzlCLCtCQUFnQztBQUVoQyw4RUFBMkU7QUFDM0UsZ0NBQTZCO0FBRzdCLG9EQUFpRDtBQUVqRDs7Ozs7O0dBTUc7QUFDSCxxQkFBNkIsU0FBUSxNQUFNLENBQUMsWUFBWTtJQTJCcEQsWUFBNkIsVUFBaUMsRUFBRTtRQUM1RCxLQUFLLEVBQUUsQ0FBQztRQURpQixZQUFPLEdBQVAsT0FBTyxDQUE0QjtRQWhCeEQsWUFBTyxHQUFrQiw2QkFBYSxDQUFDLE9BQU8sQ0FBQztRQVN2RDs7OztXQUlHO1FBQ00sYUFBUSxHQUFHLElBQUksR0FBRyxFQUE2QixDQUFBO1FBZ0h4RDs7OztXQUlHO1FBQ0gsVUFBSyxHQUFHLE1BQU0sWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxxQkFBcUI7UUFpQ3pFOzs7OztXQUtHO1FBQ0gsU0FBSSxHQUFHLENBQUMsUUFBUSxHQUFHLENBQUMsS0FBSyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUF2Sm5FLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyx1QkFBdUIsQ0FBQztZQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxRQUFRLENBQUMsQ0FBQztRQUNuRixlQUFlLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDO1FBRS9DLE9BQU8sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxHQUFVO1lBQ3hDLFNBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUV2QyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMs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QyxhQUE0QjtRQUN4QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRCxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sYUFBYSxDQUFDLElBQUksUUFBUSxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxxQ0FBaUIsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNsRyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxPQUFPLENBQUMsR0FBVSxFQUFFLE9BQXNCO1FBQ3RDLFNBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNqRCxDQUFDOztBQXpPRCxvREFBb0Q7QUFDckMsdUNBQXVCLEdBQUcsS0FBSyxDQUFDO0FBSG5ELDBDQTRPQyIsImZpbGUiOiJTZXJ2aWNlc01hbmFnZXIvU2VydmljZXNNYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuaW1wb3J0IGh0dHAgPSByZXF1aXJlKCdodHRwJyk7XG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuXG5pbXBvcnQgeyBSZWdpc3RlcmVkU2VydmljZSB9IGZyb20gJy4uL1JlZ2lzdGVyZWRTZXJ2aWNlL1JlZ2lzdGVyZWRTZXJ2aWNlJztcbmltcG9ydCB7IGxvZyB9IGZyb20gJy4uL0xvZyc7XG5pbXBvcnQgeyBTZXJ2aWNlTW9kdWxlIH0gZnJvbSBcIi4uL1NlcnZpY2VNb2R1bGUvU2VydmljZU1vZHVsZVwiO1xuaW1wb3J0IHsgU2VydmljZXNNYW5hZ2VyQ29uZmlnIH0gZnJvbSBcIi4vU2VydmljZXNNYW5hZ2VyQ29uZmlnXCI7XG5pbXBvcnQgeyBSdW5uaW5nU3RhdHVzIH0gZnJvbSBcIi4uL1J1bm5pbmdTdGF0dXNcIjtcblxuLyoqXG4gKiDmnI3liqHnrqHnkIblmahcbiAqIFxuICogQGV4cG9ydFxuICogQGNsYXNzIFNlcnZpY2VzTWFuYWdlclxuICogQGV4dGVuZHMge2V2ZW50cy5FdmVudEVtaXR0ZXJ9XG4gKi9cbmV4cG9ydCBjbGFzcyBTZXJ2aWNlc01hbmFnZXIgZXh0ZW5kcyBldmVudHMuRXZlbnRFbWl0dGVyIHtcblxuICAgIC8vU2VydmljZXNNYW5hZ2Vy5piv5ZCm5bey57uP5Yib5bu65LqG77yI5LiA5Liq5a655Zmo5Y+q5YWB6K645Yib5bu65LiA5LiqU2VydmljZXNNYW5hZ2Vy77yJXG4gICAgcHJpdmF0ZSBzdGF0aWMgX3NlcnZpY2VzTWFuYWdlckNyZWF0ZWQgPSBmYWxzZTtcblxuICAgIC8qKlxuICAgICAqIOi/kOihjOeKtuaAgVxuICAgICAqL1xuICAgIGdldCBzdGF0dXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXM7XG4gICAgfVxuICAgIHByaXZhdGUgX3N0YXR1czogUnVubmluZ1N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZDtcblxuICAgIC8qKlxuICAgICAqIFNlcnZpY2VzTWFuYWdlciDnmoTlkI3np7DvvIzpu5jorqTmmK/nsbvlkI3jgIJcbiAgICAgKi9cbiAgICBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOazqOWGjOeahOacjeWKoeWIl+ihqOOAgijmnI3liqHlj6rlupTlvZPpgJrov4dyZWdpc3RlclNlcnZpY2XmnaXov5vooYzms6jlhowpXG4gICAgICogXG4gICAgICoga2V55piv5pyN5Yqh5ZCN56ewXG4gICAgICovXG4gICAgcmVhZG9ubHkgc2VydmljZXMgPSBuZXcgTWFwPHN0cmluZywgUmVnaXN0ZXJlZFNlcnZpY2U+KClcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX2NvbmZpZzogU2VydmljZXNNYW5hZ2VyQ29uZmlnID0ge30pIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICBpZiAoU2VydmljZXNNYW5hZ2VyLl9zZXJ2aWNlc01hbmFnZXJDcmVhdGVkKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5uYW1lfeW3sue7j+iiq+WIm+W7uuS6hmApO1xuICAgICAgICBTZXJ2aWNlc01hbmFnZXIuX3NlcnZpY2VzTWFuYWdlckNyZWF0ZWQgPSB0cnVlO1xuXG4gICAgICAgIHByb2Nlc3Mub24oJ3VuaGFuZGxlZFJlamVjdGlvbicsIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICBsb2cuczEuZSgn56iL5bqPJywgJ+WHuueOsOacquaNleaNiVByb21pc2XlvILluLjvvJonLCBlcnIpO1xuXG4gICAgICAgICAgICBpZiAoX2NvbmZpZy5zdG9wT25IYXZlVW5oYW5kbGVkUmVqZWN0aW9uICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIC8v56Gu5L+d5LiN5Lya6YeN5aSN5YWz6ZetXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5zdG9wcGluZykge1xuICAgICAgICAgICAgICAgICAgICAvL+WmguaenOacjeWKoei/mOacquWQr+WKqOi/h1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3RhdHVzID09PSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcHJvY2Vzcy5vbigndW5jYXVnaHRFeGNlcHRpb24nLCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgbG9nLnMxLmUoJ+eoi+W6jycsICflh7rnjrDmnKrmjZXmjYnlvILluLjvvJonLCBlcnIpO1xuXG4gICAgICAgICAgICBpZiAoX2NvbmZpZy5zdG9wT25IYXZlVW5jYXVnaHRFeGNlcHRpb24gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5zdG9wcGluZykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3RhdHVzID09PSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IGZvcmNlQ2xvc2UgPSBmYWxzZTsgICAgIC8v55So5LqO5qCH6K6w5piv5ZCm5by65Yi26YCA5Ye656iL5bqPXG4gICAgICAgIGNvbnN0IHNpZ25hbENsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5zdG9wcGluZykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0dXMgPT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZCkge1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChmb3JjZUNsb3NlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygn5q2j5Zyo5YGc5q2i56iL5bqP77yM6K+356iN5ZCO44CC44CC44CCJywgbG9nLmNoYWxrLmdyYXkoJ++8iOWmguaenOimgeW8uuWItumAgOWHuu+8jOivt+WcqDPnp5Lpkp/kuYvlhoXlho3mrKHngrnlh7vvvIknKSk7XG4gICAgICAgICAgICAgICAgICAgIGZvcmNlQ2xvc2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlQ2xvc2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMzAwMCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHByb2Nlc3Mub24oJ1NJR1RFUk0nLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoX2NvbmZpZy5zdG9wT25IYXZlU0lHVEVSTSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBzaWduYWxDbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBwcm9jZXNzLm9uKCdTSUdJTlQnLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoX2NvbmZpZy5zdG9wT25IYXZlU0lHSU5UICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHNpZ25hbENsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8v6YWN572u5YGl5bq35qOA5p+l5pyN5YqhXG4gICAgICAgIGlmIChfY29uZmlnLnN0YXJ0SGVhbHRoQ2hlY2tpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAvL+imgeiiq+ebkeWQrOeahOerr+WPo1xuICAgICAgICAgICAgY29uc3QgcG9ydCA9IFwiL3RtcC9zZXJ2aWNlX3N0YXJ0ZXJfaGVhbHRoX2NoZWNraW5nLnNvY2tcIjtcblxuICAgICAgICAgICAgLy/liKDpmaTkuYvliY3nmoTnq6/lj6PvvIzpgb/lhY3ooqvljaDnlKhcbiAgICAgICAgICAgIGZzLnJlbW92ZVN5bmMocG9ydCk7XG5cbiAgICAgICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMucnVubmluZykge1xuICAgICAgICAgICAgICAgICAgICAvL+acjeWKoei/mOacquWkhOS6jnJ1bm5pbmfml7bnm7TmjqXov5Tlm57lvZPliY3nmoTnirbmgIHlkI3np7BcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoUnVubmluZ1N0YXR1c1t0aGlzLl9zdGF0dXNdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0OiBbRXJyb3IsIFJlZ2lzdGVyZWRTZXJ2aWNlXSB8IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICAvL+ajgOafpeavj+S4gOS4quacjeWKoeeahOWBpeW6t+eKtuWGtVxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRoaXMuc2VydmljZXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGF3YWl0IGl0ZW0uX2hlYWx0aENoZWNrKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8v5LiN5Li656m65bCx6KGo56S65pyJ6Zeu6aKY5LqGXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBbZXJyLCBpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZChSdW5uaW5nU3RhdHVzW3RoaXMuX3N0YXR1c10pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZChgWyR7cmVzdWx0WzFdLnNlcnZpY2UubmFtZX1dICAke3Jlc3VsdFswXX1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLmxpc3Rlbihwb3J0LCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nLnMxLmUoJ1NlcnZpY2VzTWFuYWdlcicsICflgaXlurfmo4Dmn6XmnI3liqHlmajlkK/liqjlpLHotKXvvJonLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlkK/liqjmiYDmnInms6jlhoznmoTmnI3liqHjgILmjInnhafms6jlhoznmoTlhYjlkI7pobrluo/mnaXlkK/liqjmnI3liqHjgILlhYjms6jlhoznmoTmnI3liqHlhYjlkK/liqjjgIIgICAgIFxuICAgICAqIOWmguaenOWQr+WKqOi/h+eoi+S4reafkOS4quacjeWKoeWHuueOsOW8guW4uO+8jOWImeWQjumdoueahOacjeWKoeWImeS4jeWGjeiiq+WQr+WKqO+8jOS5i+WJjeWQr+WKqOi/h+S6hueahOacjeWKoeS5n+S8muiiq+S+neasoeWFs+mXre+8iOaMieeFp+S7juWQjuWQkeWJjeeahOmhuuW6j++8ieOAgiAgICAgXG4gICAgICog5ZCv5Yqo57uT5p2f5ZCO5Lya6Kem5Y+Rc3RhcnRlZOS6i+S7tlxuICAgICAqL1xuICAgIHN0YXJ0ID0gKCkgPT4gc2V0SW1tZWRpYXRlKHRoaXMuX3N0YXJ0LmJpbmQodGhpcykpOyAvL+S4u+imgeaYr+S4uuS6huetieW+heaehOmAoOWHveaVsOS4reeahOS6i+S7tue7keWumuWujOaIkFxuICAgIHByaXZhdGUgYXN5bmMgX3N0YXJ0KCkge1xuICAgICAgICAvL+ehruS/neWPquacieWcqHN0b3BwZWTnmoTmg4XlhrXkuIvmiY3og73miafooYxzdGFydFxuICAgICAgICBpZiAodGhpcy5fc3RhdHVzICE9PSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBsb2cuczEuZm9ybWF0KFxuICAgICAgICAgICAgICAgICAgICBg5pyN5Yqh566h55CG5Zmo77yaJHt0aGlzLm5hbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgJ+WcqOi/mOacquWujOWFqOWFs+mXreeahOaDheWGteS4i+WPiOWGjeasoeiiq+WQr+WKqOOAgicsXG4gICAgICAgICAgICAgICAgICAgIGDlvZPliY3nmoTnirbmgIHkuLrvvJoke1J1bm5pbmdTdGF0dXNbdGhpcy5fc3RhdHVzXX1gXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxvZy5zMS5sKGxvZy5jaGFsay5ib2xkLmJnTWFnZW50YSh0aGlzLm5hbWUpLCAn5byA5aeL5ZCv5Yqo5pyN5YqhJyk7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMuc3RhcnRpbmc7XG5cbiAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLnNlcnZpY2VzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICAvL+WmguaenOWQr+WKqOi/h+eoi+S4reWHuueOsOS6huW8guW4uOWImeWwseS4jeWGjeWQkeS4i+WQr+WKqOS6hu+8iOWboOS4uuWHuueOsOS6huW8guW4uOS5i+WQjl9zdGF0dXPmiJblj5jkuLpzdG9wcGluZ++8iVxuICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5zdGFydGluZykgcmV0dXJuO1xuXG4gICAgICAgICAgICBjb25zdCBmYWlsZWQgPSBhd2FpdCBpdGVtLl9zdGFydCgpO1xuXG4gICAgICAgICAgICAvL+S4jeS4uuepuuWImeihqOekuuWQr+WKqOWksei0pVxuICAgICAgICAgICAgaWYgKGZhaWxlZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RvcCgyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxvZy5zMS5sKGxvZy5jaGFsay5ib2xkLmJnTWFnZW50YSh0aGlzLm5hbWUpLCAn5omA5pyJ5pyN5Yqh5bey5ZCv5YqoJyk7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMucnVubmluZztcbiAgICAgICAgdGhpcy5lbWl0KCdzdGFydGVkJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5YWz6Zet5omA5pyJ5bey5ZCv5Yqo55qE5pyN5Yqh44CC5YWI5rOo5YaM55qE5pyN5Yqh5pyA5ZCO6KKr5YWz6Zet44CC5b2T5omA5pyJ5pyN5Yqh6YO96KKr5YWz6Zet5ZCO5bCG5Lya6YCA5Ye656iL5bqP44CCXG4gICAgICog5b2T5omA5pyJ5pyN5Yqh6YO95YGc5q2i5ZCO5Ye65Y+Rc3RvcHBlZOS6i+S7tlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBleGl0Q29kZSDnqIvluo/pgIDlh7rnirbmgIHnoIHjgIIgMeaYr+ezu+e7n+mUmeivryAgMueUqOaIt+acjeWKoemUmeivr1xuICAgICAqL1xuICAgIHN0b3AgPSAoZXhpdENvZGUgPSAwKSA9PiBzZXRJbW1lZGlhdGUodGhpcy5fc3RvcC5iaW5kKHRoaXMpLCBleGl0Q29kZSk7XG4gICAgcHJpdmF0ZSBhc3luYyBfc3RvcChleGl0Q29kZTogbnVtYmVyKSB7XG4gICAgICAgIC8v56Gu5L+d5LiN5Lya6YeN5aSN5YGc5q2iXG4gICAgICAgIGlmICh0aGlzLl9zdGF0dXMgPT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBpbmcgfHwgdGhpcy5fc3RhdHVzID09PSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBsb2cuczEuZm9ybWF0KFxuICAgICAgICAgICAgICAgICAgICBg5pyN5Yqh566h55CG5Zmo77yaJHt0aGlzLm5hbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgJ+WcqOWkhOS6juato+WcqOWBnOatouaIluW3suWBnOatoueahOeKtuaAgeS4i+WPiOWGjeasoeiiq+WBnOatouOAgicsXG4gICAgICAgICAgICAgICAgICAgIGDlvZPliY3nmoTnirbmgIHkuLrvvJoke1J1bm5pbmdTdGF0dXNbdGhpcy5fc3RhdHVzXX1gXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxvZy5zMS5sKGxvZy5jaGFsay5ib2xkLmJnTWFnZW50YSh0aGlzLm5hbWUpLCAn5byA5aeL5YGc5q2i5pyN5YqhJyk7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMuc3RvcHBpbmc7XG5cbiAgICAgICAgZm9yIChsZXQgaXRlbSBvZiBBcnJheS5mcm9tKHRoaXMuc2VydmljZXMudmFsdWVzKCkpLnJldmVyc2UoKSkge1xuICAgICAgICAgICAgaWYgKGl0ZW0uc3RhdHVzICE9PSBSdW5uaW5nU3RhdHVzLnN0b3BwaW5nICYmIGl0ZW0uc3RhdHVzICE9PSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQpXG4gICAgICAgICAgICAgICAgYXdhaXQgaXRlbS5fc3RvcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgbG9nLnMxLmwobG9nLmNoYWxrLmJvbGQuYmdNYWdlbnRhKHRoaXMubmFtZSksICfmiYDmnInmnI3liqHlt7LlgZzmraInKTtcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gUnVubmluZ1N0YXR1cy5zdG9wcGVkO1xuICAgICAgICB0aGlzLmVtaXQoJ3N0b3BwZWQnKTtcblxuICAgICAgICAvL+aYr+WQpumAgOWHuuacjeWKoVxuICAgICAgICBpZiAodGhpcy5fY29uZmlnLmV4aXRBZnRlclN0b3BwZWQgIT09IGZhbHNlKVxuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KGV4aXRDb2RlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDms6jlhozmnI3liqHjgILms6jlhozmnI3liqHnmoTlkI3np7DmmK/ku6XnsbvlkI3kuLrlh4ZcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1NlcnZpY2VNb2R1bGV9IHNlcnZpY2VNb2R1bGUg5pyN5Yqh5qih5Z2X5a6e5L6LXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlclxuICAgICAqL1xuICAgIHJlZ2lzdGVyU2VydmljZShzZXJ2aWNlTW9kdWxlOiBTZXJ2aWNlTW9kdWxlKSB7XG4gICAgICAgIGlmICh0aGlzLnNlcnZpY2VzLmhhcyhzZXJ2aWNlTW9kdWxlLmNvbnN0cnVjdG9yLm5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOacjeWKoe+8micke3NlcnZpY2VNb2R1bGUubmFtZX0n5bey5rOo5YaM6L+H5LqGYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNlcnZpY2VzLnNldChzZXJ2aWNlTW9kdWxlLmNvbnN0cnVjdG9yLm5hbWUsIG5ldyBSZWdpc3RlcmVkU2VydmljZShzZXJ2aWNlTW9kdWxlLCB0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmnI3liqHov5DooYzov4fnqIvkuK3nmoTplJnor6/lpITnkIbmlrnms5XjgILmnI3liqHlkK/liqjmiJblhbPpl63ov4fnqIvkuK3kuqfnlJ/nmoTplJnor6/kuI3kvJrop6blj5Hor6Xmlrnms5XjgIJcbiAgICAgKiDms6jmhI/vvJpvbkVycm9y5Lit55qE5Luj56CB5LiN5bqU5Ye6546w6ZSZ6K+v77yM5aaC5p6cb25FcnJvcueahOS4reeahOS7o+eggeWHuueOsOmUmeivr+WwhuebtOaOpeWvvOiHtOeoi+W6j+WFs+mXreOAglxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7RXJyb3J9IGVyciBcbiAgICAgKiBAcGFyYW0ge1NlcnZpY2VNb2R1bGV9IHNlcnZpY2Ug5Y+R55Sf6ZSZ6K+v55qE5pyN5Yqh5a6e5L6LXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlclxuICAgICAqL1xuICAgIG9uRXJyb3IoZXJyOiBFcnJvciwgc2VydmljZTogU2VydmljZU1vZHVsZSkge1xuICAgICAgICBsb2cuczEuZShg5pyN5Yqh77yaJHtzZXJ2aWNlLm5hbWV9YCwgJ+WPkeeUn+mUmeivr++8micsIGVycik7XG4gICAgfVxufSJdfQ==
