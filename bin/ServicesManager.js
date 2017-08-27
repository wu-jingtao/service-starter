"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Log_1 = require("./Log");
const events = require("events");
const ServiceModule_1 = require("./ServiceModule");
const http = require("http");
const fs = require("fs-extra");
/**
 * 保存注册了的服务
 *
 * @class _Services
 */
class _Services {
    constructor(service) {
        /**
         * 服务是否已启动
         *
         * @type {boolean}
         * @memberof _Services
         */
        this.isStarted = false;
        this.service = service;
        this.name = service.name;
    }
}
class ServicesManager extends events.EventEmitter {
    constructor(config = {}) {
        super();
        this._isStarted = false; //是否已经启动
        this._services = []; //注册的服务
        if (ServicesManager._servicesManagerCreated)
            throw new Error('ServicesManager已经被创建了');
        ServicesManager._servicesManagerCreated = true;
        process.on('unhandledRejection', (err) => {
            Log_1.log.e('程序出现未捕捉Promise异常', err);
            if (config.stopOnHaveUnhandledRejection !== false) {
                this.stop(1);
            }
        });
        process.on('uncaughtException', (err) => {
            Log_1.log.e('程序出现未捕捉异常', err);
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
            //删除之前的接口，避免被占用
            fs.removeSync("/tmp/node_service_starter/health_checking.sock");
            http.createServer(async (req, res) => {
                Log_1.log.l('接收到健康检查请求');
                let result = ServiceModule_1.HealthStatus.success;
                //检查每一个服务的健康状况
                for (let item of this._services) {
                    //跳过未启动的服务
                    if (!item.isStarted)
                        continue;
                    try {
                        const status = await item.service.onHealthChecking();
                        if (status != ServiceModule_1.HealthStatus.success) {
                            Log_1.log.w(item.name, '的运行健康状况出现不正常：', status);
                            result = status;
                            break;
                        }
                    }
                    catch (error) {
                        Log_1.log.e(item.name, '在进行健康检查时发生异常', error);
                        break;
                    }
                }
                res.end(result.toString());
            }).listen("/tmp/node_service_starter/health_checking.sock", (err) => {
                if (err) {
                    Log_1.log.e('健康检查服务启动失败：', err);
                    process.exit(1);
                }
            });
        }
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
            Log_1.log.l(this.constructor.name, '开始启动服务');
            this._isStarted = true;
            (async () => {
                for (let item of this._services) {
                    try {
                        Log_1.log.starting('开始启动服务', item.name);
                        item.isStarted = true;
                        await item.service.onStart();
                        //绑定错误处理器
                        item.service.on('error', item.errorListener);
                        Log_1.log.started('服务启动成功', item.name);
                    }
                    catch (error) {
                        Log_1.log.startFailed('服务启动失败', item.name, error);
                        this.stop();
                        return;
                    }
                }
                Log_1.log.l('所有服务已启动');
                this.emit('started');
            })();
        }
    }
    /**
     * 关闭所有已启动的服务。先注册的服务最后被关闭。当所有服务都被关闭后程序将会被退出。
     * 当所有服务都停止后出发stopped事件
     *
     * @param exitCode 程序退出状态码
     */
    stop(exitCode = 0) {
        if (this._isStarted === true) {
            Log_1.log.l(this.constructor.name, '开始停止服务');
            this._isStarted = false;
            (async () => {
                for (let item of this._services.reverse()) {
                    if (item.isStarted) {
                        try {
                            Log_1.log.stopping('开始停止服务', item.name);
                            item.isStarted = false;
                            await item.service.onStop();
                            //清除绑定的错误监听器
                            item.service.removeListener('error', item.errorListener);
                            Log_1.log.stopped('服务启动成功', item.name);
                        }
                        catch (error) {
                            Log_1.log.stopFailed('服务停止失败', item.name, error);
                        }
                    }
                }
                Log_1.log.l('所有服务已停止');
                this.emit('stopped');
                //退出服务
                process.exit(exitCode);
            })();
        }
    }
    /**
     * 注册服务
     *
     * @param {ServiceModule} serviceModule 服务模块实例
     * @memberof ServicesManager
     */
    registerService(serviceModule) {
        if (this._services.some(item => item.name == serviceModule.name)) {
            throw new Error(`服务'${serviceModule.name}'已注册过了`);
        }
        else {
            const service = new _Services(serviceModule);
            //创建服务运行时错误监听器
            service.errorListener = (err) => {
                const value = service.service.onError(err);
                switch (value) {
                    case false:
                        this.onError(err, serviceModule);
                        break;
                    case true:
                        break;
                    case 'stop':
                        this.onError(err, serviceModule);
                        this.stop();
                        break;
                    default:
                        if (value instanceof Error)
                            this.onError(value, serviceModule);
                        break;
                }
            };
            this._services.push(service);
        }
    }
    /**
     * 服务运行过程中的错误处理方法。服务启动或关闭过程中产生的错误不会触发该方法。
     *
     * @param {Error} err
     * @param {ServiceModule} service 发生错误的服务实例
     * @memberof ServicesManager
     */
    onError(err, service) {
        Log_1.log.e(service.name, '发生错误：', err);
    }
}
ServicesManager._servicesManagerCreated = false; //ServicesManager是否已经创建了（一个进程只允许创建一个ServicesManager）
exports.ServicesManager = ServicesManager;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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SUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN0QyxDQUFDOztBQW5NYyx1Q0FBdUIsR0FBRyxLQUFLLENBQUMsQ0FBQyxvREFBb0Q7QUFIeEcsMENBdU1DIiwiZmlsZSI6IlNlcnZpY2VzTWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGxvZyB9IGZyb20gJy4vTG9nJztcbmltcG9ydCBldmVudHMgPSByZXF1aXJlKCdldmVudHMnKTtcbmltcG9ydCB7IFNlcnZpY2VNb2R1bGUsIEhlYWx0aFN0YXR1cyB9IGZyb20gXCIuL1NlcnZpY2VNb2R1bGVcIjtcbmltcG9ydCBodHRwID0gcmVxdWlyZSgnaHR0cCcpO1xuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcblxuLyoqXG4gKiBTZXJ2aWNlc01hbmFnZXLphY3nva5cbiAqIFxuICogQGV4cG9ydFxuICogQGludGVyZmFjZSBTZXJ2aWNlc01hbmFnZXJDb25maWdcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXJ2aWNlc01hbmFnZXJDb25maWcge1xuICAgIC8qKlxuICAgICAqIOW9k+acieacquaNleiOt+W8guW4uOeahFByb21pc2XkuqfnlJ/ml7bmmK/lkKblgZzmraLmnI3liqEo6buY6K6kdHJ1ZSzlgZzmraIpXG4gICAgICogXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlckNvbmZpZ1xuICAgICAqL1xuICAgIHN0b3BPbkhhdmVVbmhhbmRsZWRSZWplY3Rpb24/OiBib29sZWFuO1xuXG4gICAgLyoqXG4gICAgICog5b2T5pyJ5pyq5o2V6I635byC5bi45Lqn55Sf5pe25piv5ZCm5YGc5q2i5pyN5YqhKOm7mOiupHRydWUs5YGc5q2iKVxuICAgICAqIFxuICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAqIEBtZW1iZXJvZiBTZXJ2aWNlc01hbmFnZXJDb25maWdcbiAgICAgKi9cbiAgICBzdG9wT25IYXZlVW5jYXVnaHRFeGNlcHRpb24/OiBib29sZWFuO1xuXG4gICAgLyoqXG4gICAgICog5b2T5pS25YiwU0lHVEVSTeS/oeWPt+aXtuaYr+WQpuWBnOatouacjeWKoSjpu5jorqR0cnVlLOWBnOatoilcbiAgICAgKiBcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyQ29uZmlnXG4gICAgICovXG4gICAgc3RvcE9uSGF2ZVNJR1RFUk0/OiBib29sZWFuO1xuXG4gICAgLyoqXG4gICAgKiDlvZPmlLbliLBTSUdJTlTkv6Hlj7fml7bmmK/lkKblgZzmraLmnI3liqEo6buY6K6kdHJ1ZSzlgZzmraIpXG4gICAgKiBcbiAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlckNvbmZpZ1xuICAgICovXG4gICAgc3RvcE9uSGF2ZVNJR0lOVD86IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiDmmK/lkKblkK/liqjlgaXlurfmo4Dmn6Uo6buY6K6kdHJ1ZSzlkK/liqgpXG4gICAgICogXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlckNvbmZpZ1xuICAgICAqL1xuICAgIHN0YXJ0SGVhbHRoQ2hlY2tpbmc/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIOS/neWtmOazqOWGjOS6hueahOacjeWKoVxuICogXG4gKiBAY2xhc3MgX1NlcnZpY2VzXG4gKi9cbmNsYXNzIF9TZXJ2aWNlcyB7XG4gICAgLyoqXG4gICAgICog5pyN5Yqh5a6e5L6LXG4gICAgICogXG4gICAgICogQHR5cGUge1NlcnZpY2VNb2R1bGV9XG4gICAgICogQG1lbWJlcm9mIF9TZXJ2aWNlc1xuICAgICAqL1xuICAgIHJlYWRvbmx5IHNlcnZpY2U6IFNlcnZpY2VNb2R1bGU7XG5cbiAgICAvKipcbiAgICAgKiDmnI3liqHmmK/lkKblt7LlkK/liqhcbiAgICAgKiBcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKiBAbWVtYmVyb2YgX1NlcnZpY2VzXG4gICAgICovXG4gICAgaXNTdGFydGVkID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiDmnI3liqHnmoTlkI3np7DjgILvvIjov5nph4zlho3kv53lrZjkuIDmrKHmnI3liqHnmoTlkI3np7DmmK/lm6DkuLrkuI3lhYHorrjmnI3liqHlkI3np7DlnKjov5DooYzov4fnqIvkuK3ooqvmlLnlj5jvvIlcbiAgICAgKiBcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqIEBtZW1iZXJvZiBfU2VydmljZXNcbiAgICAgKi9cbiAgICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiDnu5HlrprlnKjmnI3liqHkuIrnmoTplJnor6/nm5HlkKzlmajjgILnlKjkuo7kuYvlkI7liKDpmaTnm5HlkKzlmajml7bkvb/nlKhcbiAgICAgKiBcbiAgICAgKiBAdHlwZSB7RnVuY3Rpb259XG4gICAgICogQG1lbWJlcm9mIF9TZXJ2aWNlc1xuICAgICAqL1xuICAgIGVycm9yTGlzdGVuZXI6IEZ1bmN0aW9uO1xuXG4gICAgY29uc3RydWN0b3Ioc2VydmljZTogU2VydmljZU1vZHVsZSkge1xuICAgICAgICB0aGlzLnNlcnZpY2UgPSBzZXJ2aWNlO1xuICAgICAgICB0aGlzLm5hbWUgPSBzZXJ2aWNlLm5hbWU7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2VydmljZXNNYW5hZ2VyIGV4dGVuZHMgZXZlbnRzLkV2ZW50RW1pdHRlciB7XG5cbiAgICBwcml2YXRlIF9pc1N0YXJ0ZWQgPSBmYWxzZTsgICAgLy/mmK/lkKblt7Lnu4/lkK/liqhcbiAgICBwcml2YXRlIHN0YXRpYyBfc2VydmljZXNNYW5hZ2VyQ3JlYXRlZCA9IGZhbHNlOyAvL1NlcnZpY2VzTWFuYWdlcuaYr+WQpuW3sue7j+WIm+W7uuS6hu+8iOS4gOS4qui/m+eoi+WPquWFgeiuuOWIm+W7uuS4gOS4qlNlcnZpY2VzTWFuYWdlcu+8iVxuICAgIHByaXZhdGUgcmVhZG9ubHkgX3NlcnZpY2VzOiBfU2VydmljZXNbXSA9IFtdOyAgIC8v5rOo5YaM55qE5pyN5YqhXG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IFNlcnZpY2VzTWFuYWdlckNvbmZpZyA9IHt9KSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgaWYgKFNlcnZpY2VzTWFuYWdlci5fc2VydmljZXNNYW5hZ2VyQ3JlYXRlZCkgdGhyb3cgbmV3IEVycm9yKCdTZXJ2aWNlc01hbmFnZXLlt7Lnu4/ooqvliJvlu7rkuoYnKTtcbiAgICAgICAgU2VydmljZXNNYW5hZ2VyLl9zZXJ2aWNlc01hbmFnZXJDcmVhdGVkID0gdHJ1ZTtcblxuICAgICAgICBwcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgbG9nLmUoJ+eoi+W6j+WHuueOsOacquaNleaNiVByb21pc2XlvILluLgnLCBlcnIpO1xuXG4gICAgICAgICAgICBpZiAoY29uZmlnLnN0b3BPbkhhdmVVbmhhbmRsZWRSZWplY3Rpb24gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBwcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICBsb2cuZSgn56iL5bqP5Ye6546w5pyq5o2V5o2J5byC5bi4JywgZXJyKTtcblxuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlVW5jYXVnaHRFeGNlcHRpb24gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBwcm9jZXNzLm9uKCdTSUdURVJNJywgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlU0lHVEVSTSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcHJvY2Vzcy5vbignU0lHSU5UJywgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlU0lHSU5UICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvL+mFjee9ruWBpeW6t+ajgOafpeacjeWKoVxuICAgICAgICBpZiAoY29uZmlnLnN0YXJ0SGVhbHRoQ2hlY2tpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAvL+WIoOmZpOS5i+WJjeeahOaOpeWPo++8jOmBv+WFjeiiq+WNoOeUqFxuICAgICAgICAgICAgZnMucmVtb3ZlU3luYyhcIi90bXAvbm9kZV9zZXJ2aWNlX3N0YXJ0ZXIvaGVhbHRoX2NoZWNraW5nLnNvY2tcIik7XG5cbiAgICAgICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIGxvZy5sKCfmjqXmlLbliLDlgaXlurfmo4Dmn6Xor7fmsYInKTtcblxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBIZWFsdGhTdGF0dXMuc3VjY2VzcztcblxuICAgICAgICAgICAgICAgIC8v5qOA5p+l5q+P5LiA5Liq5pyN5Yqh55qE5YGl5bq354q25Ya1XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLl9zZXJ2aWNlcykge1xuICAgICAgICAgICAgICAgICAgICAvL+i3s+i/h+acquWQr+WKqOeahOacjeWKoVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uaXNTdGFydGVkKSBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgaXRlbS5zZXJ2aWNlLm9uSGVhbHRoQ2hlY2tpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgIT0gSGVhbHRoU3RhdHVzLnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2cudyhpdGVtLm5hbWUsICfnmoTov5DooYzlgaXlurfnirblhrXlh7rnjrDkuI3mraPluLjvvJonLCBzdGF0dXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZy5lKGl0ZW0ubmFtZSwgJ+WcqOi/m+ihjOWBpeW6t+ajgOafpeaXtuWPkeeUn+W8guW4uCcsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzLmVuZChyZXN1bHQudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICB9KS5saXN0ZW4oXCIvdG1wL25vZGVfc2VydmljZV9zdGFydGVyL2hlYWx0aF9jaGVja2luZy5zb2NrXCIsIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBsb2cuZSgn5YGl5bq35qOA5p+l5pyN5Yqh5ZCv5Yqo5aSx6LSl77yaJywgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5ZCv5Yqo5omA5pyJ5rOo5YaM55qE5pyN5Yqh44CC5oyJ54Wn5rOo5YaM55qE5YWI5ZCO6aG65bqP5p2l5ZCv5Yqo5pyN5Yqh44CC5YWI5rOo5YaM55qE5pyN5Yqh5YWI5ZCv5Yqo44CCICAgICBcbiAgICAgKiDlpoLmnpzlkK/liqjov4fnqIvkuK3mn5DkuKrmnI3liqHlh7rnjrDlvILluLjvvIzliJnlkI7pnaLnmoTmnI3liqHliJnkuI3lho3ooqvlkK/liqjvvIzkuYvliY3lkK/liqjov4fkuobnmoTmnI3liqHkuZ/kvJrooqvkvp3mrKHlhbPpl63vvIjmjInnhafku47lkI7lkJHliY3nmoTpobrluo/vvInjgIIgICAgIFxuICAgICAqIOWQr+WKqOe7k+adn+WQjuS8muinpuWPkXN0YXJ0ZWTkuovku7ZcbiAgICAgKiBcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyXG4gICAgICovXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc1N0YXJ0ZWQgPT09IGZhbHNlKSB7XG5cbiAgICAgICAgICAgIGxvZy5sKHRoaXMuY29uc3RydWN0b3IubmFtZSwgJ+W8gOWni+WQr+WKqOacjeWKoScpO1xuICAgICAgICAgICAgdGhpcy5faXNTdGFydGVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRoaXMuX3NlcnZpY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2cuc3RhcnRpbmcoJ+W8gOWni+WQr+WKqOacjeWKoScsIGl0ZW0ubmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uaXNTdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGl0ZW0uc2VydmljZS5vblN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL+e7keWumumUmeivr+WkhOeQhuWZqFxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5zZXJ2aWNlLm9uKCdlcnJvcicsIGl0ZW0uZXJyb3JMaXN0ZW5lcik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZy5zdGFydGVkKCfmnI3liqHlkK/liqjmiJDlip8nLCBpdGVtLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nLnN0YXJ0RmFpbGVkKCfmnI3liqHlkK/liqjlpLHotKUnLCBpdGVtLm5hbWUsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbG9nLmwoJ+aJgOacieacjeWKoeW3suWQr+WKqCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnc3RhcnRlZCcpO1xuICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWFs+mXreaJgOacieW3suWQr+WKqOeahOacjeWKoeOAguWFiOazqOWGjOeahOacjeWKoeacgOWQjuiiq+WFs+mXreOAguW9k+aJgOacieacjeWKoemDveiiq+WFs+mXreWQjueoi+W6j+WwhuS8muiiq+mAgOWHuuOAglxuICAgICAqIOW9k+aJgOacieacjeWKoemDveWBnOatouWQjuWHuuWPkXN0b3BwZWTkuovku7ZcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gZXhpdENvZGUg56iL5bqP6YCA5Ye654q25oCB56CBXG4gICAgICovXG4gICAgc3RvcChleGl0Q29kZSA9IDApIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzU3RhcnRlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgbG9nLmwodGhpcy5jb25zdHJ1Y3Rvci5uYW1lLCAn5byA5aeL5YGc5q2i5pyN5YqhJyk7XG4gICAgICAgICAgICB0aGlzLl9pc1N0YXJ0ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRoaXMuX3NlcnZpY2VzLnJldmVyc2UoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5pc1N0YXJ0ZWQpIHsgICAvL+WPquWFs+mXreW3suWQr+WKqOS6hueahOacjeWKoVxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2cuc3RvcHBpbmcoJ+W8gOWni+WBnOatouacjeWKoScsIGl0ZW0ubmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmlzU3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGl0ZW0uc2VydmljZS5vblN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL+a4hemZpOe7keWumueahOmUmeivr+ebkeWQrOWZqFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uc2VydmljZS5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBpdGVtLmVycm9yTGlzdGVuZXIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nLnN0b3BwZWQoJ+acjeWKoeWQr+WKqOaIkOWKnycsIGl0ZW0ubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZy5zdG9wRmFpbGVkKCfmnI3liqHlgZzmraLlpLHotKUnLCBpdGVtLm5hbWUsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxvZy5sKCfmiYDmnInmnI3liqHlt7LlgZzmraInKTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3N0b3BwZWQnKTtcblxuICAgICAgICAgICAgICAgIC8v6YCA5Ye65pyN5YqhXG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KGV4aXRDb2RlKTtcbiAgICAgICAgICAgIH0pKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDms6jlhozmnI3liqFcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1NlcnZpY2VNb2R1bGV9IHNlcnZpY2VNb2R1bGUg5pyN5Yqh5qih5Z2X5a6e5L6LXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlclxuICAgICAqL1xuICAgIHJlZ2lzdGVyU2VydmljZShzZXJ2aWNlTW9kdWxlOiBTZXJ2aWNlTW9kdWxlKSB7XG4gICAgICAgIGlmICh0aGlzLl9zZXJ2aWNlcy5zb21lKGl0ZW0gPT4gaXRlbS5uYW1lID09IHNlcnZpY2VNb2R1bGUubmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5pyN5YqhJyR7c2VydmljZU1vZHVsZS5uYW1lfSflt7Lms6jlhozov4fkuoZgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHNlcnZpY2UgPSBuZXcgX1NlcnZpY2VzKHNlcnZpY2VNb2R1bGUpO1xuXG4gICAgICAgICAgICAvL+WIm+W7uuacjeWKoei/kOihjOaXtumUmeivr+ebkeWQrOWZqFxuICAgICAgICAgICAgc2VydmljZS5lcnJvckxpc3RlbmVyID0gKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHNlcnZpY2Uuc2VydmljZS5vbkVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgc3dpdGNoICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIGZhbHNlOlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVyciwgc2VydmljZU1vZHVsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSB0cnVlOlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0b3AnOlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVyciwgc2VydmljZU1vZHVsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRXJyb3IpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKHZhbHVlLCBzZXJ2aWNlTW9kdWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuX3NlcnZpY2VzLnB1c2goc2VydmljZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmnI3liqHov5DooYzov4fnqIvkuK3nmoTplJnor6/lpITnkIbmlrnms5XjgILmnI3liqHlkK/liqjmiJblhbPpl63ov4fnqIvkuK3kuqfnlJ/nmoTplJnor6/kuI3kvJrop6blj5Hor6Xmlrnms5XjgIJcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBlcnIgXG4gICAgICogQHBhcmFtIHtTZXJ2aWNlTW9kdWxlfSBzZXJ2aWNlIOWPkeeUn+mUmeivr+eahOacjeWKoeWunuS+i1xuICAgICAqIEBtZW1iZXJvZiBTZXJ2aWNlc01hbmFnZXJcbiAgICAgKi9cbiAgICBvbkVycm9yKGVycjogRXJyb3IsIHNlcnZpY2U6IFNlcnZpY2VNb2R1bGUpIHtcbiAgICAgICAgbG9nLmUoc2VydmljZS5uYW1lLCAn5Y+R55Sf6ZSZ6K+v77yaJywgZXJyKTtcbiAgICB9XG59Il19
