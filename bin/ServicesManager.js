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
exports._Services = _Services;
class ServicesManager extends events.EventEmitter {
    constructor(config = {}) {
        super();
        this._isStarted = false; //是否已经启动
        /**
         * 注册的服务。(服务只应当通过registerService来进行注册)
         */
        this._services = [];
        if (ServicesManager._servicesManagerCreated)
            throw new Error(`${this.name}已经被创建了`);
        ServicesManager._servicesManagerCreated = true;
        process.on('unhandledRejection', (err) => {
            Log_1.log.e('程序出现未捕捉Promise异常：', err);
            if (config.stopOnHaveUnhandledRejection !== false) {
                this.stop(1);
            }
        });
        process.on('uncaughtException', (err) => {
            Log_1.log.e('程序出现未捕捉异常：', err);
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
                //log.l('接收到健康检查请求');
                let result = ServiceModule_1.HealthStatus.success;
                //检查每一个服务的健康状况
                for (let item of this._services) {
                    //跳过未启动的服务
                    if (!item.isStarted)
                        continue;
                    try {
                        const status = await item.service.onHealthChecking();
                        if (status != ServiceModule_1.HealthStatus.success) {
                            Log_1.log.w('服务', item.name, '的运行健康状况出现不正常：', status);
                            result = status;
                            break;
                        }
                    }
                    catch (error) {
                        Log_1.log.e('服务', item.name, '在进行健康检查时发生异常', error);
                        break;
                    }
                }
                res.end(result.toString());
            }).listen("/tmp/node_service_starter/health_checking.sock", (err) => {
                if (err) {
                    Log_1.log.e(this.name, '健康检查服务启动失败：', err);
                    process.exit(1);
                }
            });
        }
    }
    /**
     * ServicesManager 的名称，默认是类名。
     */
    get name() {
        return this.constructor.name;
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
            Log_1.log.l(this.name, '开始启动服务');
            this._isStarted = true;
            (async () => {
                for (let item of this._services) {
                    if (item.isStarted === false) {
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
     * @param exitCode 程序退出状态码。 1是未捕捉的系统错误 2是用户ServiceModule的onError发出的‘stop’信号
     */
    stop(exitCode = 0) {
        if (this._isStarted === true) {
            Log_1.log.l(this.name, '开始停止服务');
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
                        this.stop(2);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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Q3ZDLEtBQUssQ0FBQztnQkFDZCxDQUFDO1lBQ0wsQ0FBQyxDQUFDO1lBRUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDakMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxPQUFPLENBQUMsR0FBVSxFQUFFLE9BQXNCO1FBQ3RDLFNBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDdEMsQ0FBQzs7QUEvTWMsdUNBQXVCLEdBQUcsS0FBSyxDQUFDLENBQUMsb0RBQW9EO0FBSHhHLDBDQW1OQyIsImZpbGUiOiJTZXJ2aWNlc01hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBsb2cgfSBmcm9tICcuL0xvZyc7XHJcbmltcG9ydCBldmVudHMgPSByZXF1aXJlKCdldmVudHMnKTtcclxuaW1wb3J0IHsgU2VydmljZU1vZHVsZSwgSGVhbHRoU3RhdHVzIH0gZnJvbSBcIi4vU2VydmljZU1vZHVsZVwiO1xyXG5pbXBvcnQgaHR0cCA9IHJlcXVpcmUoJ2h0dHAnKTtcclxuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcclxuXHJcbi8qKlxyXG4gKiBTZXJ2aWNlc01hbmFnZXLphY3nva5cclxuICogXHJcbiAqIEBleHBvcnRcclxuICogQGludGVyZmFjZSBTZXJ2aWNlc01hbmFnZXJDb25maWdcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2VydmljZXNNYW5hZ2VyQ29uZmlnIHtcclxuICAgIC8qKlxyXG4gICAgICog5b2T5pyJ5pyq5o2V6I635byC5bi455qEUHJvbWlzZeS6p+eUn+aXtuaYr+WQpuWBnOatouacjeWKoSjpu5jorqR0cnVlLOWBnOatoilcclxuICAgICAqIFxyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyQ29uZmlnXHJcbiAgICAgKi9cclxuICAgIHN0b3BPbkhhdmVVbmhhbmRsZWRSZWplY3Rpb24/OiBib29sZWFuO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog5b2T5pyJ5pyq5o2V6I635byC5bi45Lqn55Sf5pe25piv5ZCm5YGc5q2i5pyN5YqhKOm7mOiupHRydWUs5YGc5q2iKVxyXG4gICAgICogXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqIEBtZW1iZXJvZiBTZXJ2aWNlc01hbmFnZXJDb25maWdcclxuICAgICAqL1xyXG4gICAgc3RvcE9uSGF2ZVVuY2F1Z2h0RXhjZXB0aW9uPzogYm9vbGVhbjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOW9k+aUtuWIsFNJR1RFUk3kv6Hlj7fml7bmmK/lkKblgZzmraLmnI3liqEo6buY6K6kdHJ1ZSzlgZzmraIpXHJcbiAgICAgKiBcclxuICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlckNvbmZpZ1xyXG4gICAgICovXHJcbiAgICBzdG9wT25IYXZlU0lHVEVSTT86IGJvb2xlYW47XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIOW9k+aUtuWIsFNJR0lOVOS/oeWPt+aXtuaYr+WQpuWBnOatouacjeWKoSjpu5jorqR0cnVlLOWBnOatoilcclxuICAgICogXHJcbiAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyQ29uZmlnXHJcbiAgICAqL1xyXG4gICAgc3RvcE9uSGF2ZVNJR0lOVD86IGJvb2xlYW47XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmmK/lkKblkK/liqjlgaXlurfmo4Dmn6Uo6buY6K6kdHJ1ZSzlkK/liqgpXHJcbiAgICAgKiBcclxuICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlckNvbmZpZ1xyXG4gICAgICovXHJcbiAgICBzdGFydEhlYWx0aENoZWNraW5nPzogYm9vbGVhbjtcclxufVxyXG5cclxuLyoqXHJcbiAqIOS/neWtmOazqOWGjOS6hueahOacjeWKoVxyXG4gKiBcclxuICogQGNsYXNzIF9TZXJ2aWNlc1xyXG4gKi9cclxuZXhwb3J0IGNsYXNzIF9TZXJ2aWNlcyB7XHJcbiAgICAvKipcclxuICAgICAqIOacjeWKoeWunuS+i1xyXG4gICAgICogXHJcbiAgICAgKiBAdHlwZSB7U2VydmljZU1vZHVsZX1cclxuICAgICAqIEBtZW1iZXJvZiBfU2VydmljZXNcclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgc2VydmljZTogU2VydmljZU1vZHVsZTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOacjeWKoeaYr+WQpuW3suWQr+WKqFxyXG4gICAgICogXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqIEBtZW1iZXJvZiBfU2VydmljZXNcclxuICAgICAqL1xyXG4gICAgaXNTdGFydGVkID0gZmFsc2U7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmnI3liqHnmoTlkI3np7DjgILvvIjov5nph4zlho3kv53lrZjkuIDmrKHmnI3liqHnmoTlkI3np7DmmK/lm6DkuLrkuI3lhYHorrjmnI3liqHlkI3np7DlnKjov5DooYzov4fnqIvkuK3ooqvmlLnlj5jvvIlcclxuICAgICAqIFxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqIEBtZW1iZXJvZiBfU2VydmljZXNcclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog57uR5a6a5Zyo5pyN5Yqh5LiK55qE6ZSZ6K+v55uR5ZCs5Zmo44CC55So5LqO5LmL5ZCO5Yig6Zmk55uR5ZCs5Zmo5pe25L2/55SoXHJcbiAgICAgKiBcclxuICAgICAqIEB0eXBlIHtGdW5jdGlvbn1cclxuICAgICAqIEBtZW1iZXJvZiBfU2VydmljZXNcclxuICAgICAqL1xyXG4gICAgZXJyb3JMaXN0ZW5lcjogRnVuY3Rpb247XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc2VydmljZTogU2VydmljZU1vZHVsZSkge1xyXG4gICAgICAgIHRoaXMuc2VydmljZSA9IHNlcnZpY2U7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gc2VydmljZS5uYW1lO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU2VydmljZXNNYW5hZ2VyIGV4dGVuZHMgZXZlbnRzLkV2ZW50RW1pdHRlciB7XHJcblxyXG4gICAgcHJpdmF0ZSBfaXNTdGFydGVkID0gZmFsc2U7ICAgIC8v5piv5ZCm5bey57uP5ZCv5YqoXHJcbiAgICBwcml2YXRlIHN0YXRpYyBfc2VydmljZXNNYW5hZ2VyQ3JlYXRlZCA9IGZhbHNlOyAvL1NlcnZpY2VzTWFuYWdlcuaYr+WQpuW3sue7j+WIm+W7uuS6hu+8iOS4gOS4qui/m+eoi+WPquWFgeiuuOWIm+W7uuS4gOS4qlNlcnZpY2VzTWFuYWdlcu+8iVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2VydmljZXNNYW5hZ2VyIOeahOWQjeensO+8jOm7mOiupOaYr+exu+WQjeOAglxyXG4gICAgICovXHJcbiAgICBnZXQgbmFtZSgpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDms6jlhoznmoTmnI3liqHjgIIo5pyN5Yqh5Y+q5bqU5b2T6YCa6L+HcmVnaXN0ZXJTZXJ2aWNl5p2l6L+b6KGM5rOo5YaMKVxyXG4gICAgICovXHJcbiAgICByZWFkb25seSBfc2VydmljZXM6IF9TZXJ2aWNlc1tdID0gW107XHJcblxyXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBTZXJ2aWNlc01hbmFnZXJDb25maWcgPSB7fSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgIGlmIChTZXJ2aWNlc01hbmFnZXIuX3NlcnZpY2VzTWFuYWdlckNyZWF0ZWQpIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLm5hbWV95bey57uP6KKr5Yib5bu65LqGYCk7XHJcbiAgICAgICAgU2VydmljZXNNYW5hZ2VyLl9zZXJ2aWNlc01hbmFnZXJDcmVhdGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgcHJvY2Vzcy5vbigndW5oYW5kbGVkUmVqZWN0aW9uJywgKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgbG9nLmUoJ+eoi+W6j+WHuueOsOacquaNleaNiVByb21pc2XlvILluLjvvJonLCBlcnIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlVW5oYW5kbGVkUmVqZWN0aW9uICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHByb2Nlc3Mub24oJ3VuY2F1Z2h0RXhjZXB0aW9uJywgKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgbG9nLmUoJ+eoi+W6j+WHuueOsOacquaNleaNieW8guW4uO+8micsIGVycik7XHJcblxyXG4gICAgICAgICAgICBpZiAoY29uZmlnLnN0b3BPbkhhdmVVbmNhdWdodEV4Y2VwdGlvbiAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBwcm9jZXNzLm9uKCdTSUdURVJNJywgKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoY29uZmlnLnN0b3BPbkhhdmVTSUdURVJNICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcHJvY2Vzcy5vbignU0lHSU5UJywgKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoY29uZmlnLnN0b3BPbkhhdmVTSUdJTlQgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3AoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvL+mFjee9ruWBpeW6t+ajgOafpeacjeWKoVxyXG4gICAgICAgIGlmIChjb25maWcuc3RhcnRIZWFsdGhDaGVja2luZyAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgLy/liKDpmaTkuYvliY3nmoTmjqXlj6PvvIzpgb/lhY3ooqvljaDnlKhcclxuICAgICAgICAgICAgZnMucmVtb3ZlU3luYyhcIi90bXAvbm9kZV9zZXJ2aWNlX3N0YXJ0ZXIvaGVhbHRoX2NoZWNraW5nLnNvY2tcIik7XHJcblxyXG4gICAgICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcihhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vbG9nLmwoJ+aOpeaUtuWIsOWBpeW6t+ajgOafpeivt+axgicpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IEhlYWx0aFN0YXR1cy5zdWNjZXNzO1xyXG5cclxuICAgICAgICAgICAgICAgIC8v5qOA5p+l5q+P5LiA5Liq5pyN5Yqh55qE5YGl5bq354q25Ya1XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRoaXMuX3NlcnZpY2VzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy/ot7Pov4fmnKrlkK/liqjnmoTmnI3liqFcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uaXNTdGFydGVkKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgaXRlbS5zZXJ2aWNlLm9uSGVhbHRoQ2hlY2tpbmcoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cyAhPSBIZWFsdGhTdGF0dXMuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nLncoJ+acjeWKoScsaXRlbS5uYW1lLCAn55qE6L+Q6KGM5YGl5bq354q25Ya15Ye6546w5LiN5q2j5bi477yaJywgc3RhdHVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHN0YXR1cztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nLmUoJ+acjeWKoScsaXRlbS5uYW1lLCAn5Zyo6L+b6KGM5YGl5bq35qOA5p+l5pe25Y+R55Sf5byC5bi4JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChyZXN1bHQudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgIH0pLmxpc3RlbihcIi90bXAvbm9kZV9zZXJ2aWNlX3N0YXJ0ZXIvaGVhbHRoX2NoZWNraW5nLnNvY2tcIiwgKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2cuZSh0aGlzLm5hbWUsJ+WBpeW6t+ajgOafpeacjeWKoeWQr+WKqOWksei0pe+8micsIGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlkK/liqjmiYDmnInms6jlhoznmoTmnI3liqHjgILmjInnhafms6jlhoznmoTlhYjlkI7pobrluo/mnaXlkK/liqjmnI3liqHjgILlhYjms6jlhoznmoTmnI3liqHlhYjlkK/liqjjgIIgICAgIFxyXG4gICAgICog5aaC5p6c5ZCv5Yqo6L+H56iL5Lit5p+Q5Liq5pyN5Yqh5Ye6546w5byC5bi477yM5YiZ5ZCO6Z2i55qE5pyN5Yqh5YiZ5LiN5YaN6KKr5ZCv5Yqo77yM5LmL5YmN5ZCv5Yqo6L+H5LqG55qE5pyN5Yqh5Lmf5Lya6KKr5L6d5qyh5YWz6Zet77yI5oyJ54Wn5LuO5ZCO5ZCR5YmN55qE6aG65bqP77yJ44CCICAgICBcclxuICAgICAqIOWQr+WKqOe7k+adn+WQjuS8muinpuWPkXN0YXJ0ZWTkuovku7ZcclxuICAgICAqIFxyXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlclxyXG4gICAgICovXHJcbiAgICBzdGFydCgpIHtcclxuICAgICAgICBpZiAodGhpcy5faXNTdGFydGVkID09PSBmYWxzZSkge1xyXG5cclxuICAgICAgICAgICAgbG9nLmwodGhpcy5uYW1lLCAn5byA5aeL5ZCv5Yqo5pyN5YqhJyk7XHJcbiAgICAgICAgICAgIHRoaXMuX2lzU3RhcnRlZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLl9zZXJ2aWNlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmlzU3RhcnRlZCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZy5zdGFydGluZygn5byA5aeL5ZCv5Yqo5pyN5YqhJywgaXRlbS5uYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmlzU3RhcnRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBpdGVtLnNlcnZpY2Uub25TdGFydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/nu5HlrprplJnor6/lpITnkIblmahcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uc2VydmljZS5vbignZXJyb3InLCBpdGVtLmVycm9yTGlzdGVuZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZy5zdGFydGVkKCfmnI3liqHlkK/liqjmiJDlip8nLCBpdGVtLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nLnN0YXJ0RmFpbGVkKCfmnI3liqHlkK/liqjlpLHotKUnLCBpdGVtLm5hbWUsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxvZy5sKCfmiYDmnInmnI3liqHlt7LlkK/liqgnKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnc3RhcnRlZCcpO1xyXG4gICAgICAgICAgICB9KSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOWFs+mXreaJgOacieW3suWQr+WKqOeahOacjeWKoeOAguWFiOazqOWGjOeahOacjeWKoeacgOWQjuiiq+WFs+mXreOAguW9k+aJgOacieacjeWKoemDveiiq+WFs+mXreWQjueoi+W6j+WwhuS8muiiq+mAgOWHuuOAglxyXG4gICAgICog5b2T5omA5pyJ5pyN5Yqh6YO95YGc5q2i5ZCO5Ye65Y+Rc3RvcHBlZOS6i+S7tlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0gZXhpdENvZGUg56iL5bqP6YCA5Ye654q25oCB56CB44CCIDHmmK/mnKrmjZXmjYnnmoTns7vnu5/plJnor68gMuaYr+eUqOaIt1NlcnZpY2VNb2R1bGXnmoRvbkVycm9y5Y+R5Ye655qE4oCYc3RvcOKAmeS/oeWPt1xyXG4gICAgICovXHJcbiAgICBzdG9wKGV4aXRDb2RlID0gMCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9pc1N0YXJ0ZWQgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgbG9nLmwodGhpcy5uYW1lLCAn5byA5aeL5YGc5q2i5pyN5YqhJyk7XHJcbiAgICAgICAgICAgIHRoaXMuX2lzU3RhcnRlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGl0ZW0gb2YgdGhpcy5fc2VydmljZXMucmV2ZXJzZSgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uaXNTdGFydGVkKSB7ICAgLy/lj6rlhbPpl63lt7LlkK/liqjkuobnmoTmnI3liqFcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZy5zdG9wcGluZygn5byA5aeL5YGc5q2i5pyN5YqhJywgaXRlbS5uYW1lKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmlzU3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgaXRlbS5zZXJ2aWNlLm9uU3RvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/muIXpmaTnu5HlrprnmoTplJnor6/nm5HlkKzlmahcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uc2VydmljZS5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBpdGVtLmVycm9yTGlzdGVuZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZy5zdG9wcGVkKCfmnI3liqHlkK/liqjmiJDlip8nLCBpdGVtLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nLnN0b3BGYWlsZWQoJ+acjeWKoeWBnOatouWksei0pScsIGl0ZW0ubmFtZSwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxvZy5sKCfmiYDmnInmnI3liqHlt7LlgZzmraInKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnc3RvcHBlZCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8v6YCA5Ye65pyN5YqhXHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoZXhpdENvZGUpO1xyXG4gICAgICAgICAgICB9KSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOazqOWGjOacjeWKoVxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge1NlcnZpY2VNb2R1bGV9IHNlcnZpY2VNb2R1bGUg5pyN5Yqh5qih5Z2X5a6e5L6LXHJcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHJlZ2lzdGVyU2VydmljZShzZXJ2aWNlTW9kdWxlOiBTZXJ2aWNlTW9kdWxlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3NlcnZpY2VzLnNvbWUoaXRlbSA9PiBpdGVtLm5hbWUgPT0gc2VydmljZU1vZHVsZS5uYW1lKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOacjeWKoScke3NlcnZpY2VNb2R1bGUubmFtZX0n5bey5rOo5YaM6L+H5LqGYCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3Qgc2VydmljZSA9IG5ldyBfU2VydmljZXMoc2VydmljZU1vZHVsZSk7XHJcblxyXG4gICAgICAgICAgICAvL+WIm+W7uuacjeWKoei/kOihjOaXtumUmeivr+ebkeWQrOWZqFxyXG4gICAgICAgICAgICBzZXJ2aWNlLmVycm9yTGlzdGVuZXIgPSAoZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBzZXJ2aWNlLnNlcnZpY2Uub25FcnJvcihlcnIpO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgZmFsc2U6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnIsIHNlcnZpY2VNb2R1bGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIHRydWU6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0b3AnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyLCBzZXJ2aWNlTW9kdWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdG9wKDIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFcnJvcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcih2YWx1ZSwgc2VydmljZU1vZHVsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fc2VydmljZXMucHVzaChzZXJ2aWNlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmnI3liqHov5DooYzov4fnqIvkuK3nmoTplJnor6/lpITnkIbmlrnms5XjgILmnI3liqHlkK/liqjmiJblhbPpl63ov4fnqIvkuK3kuqfnlJ/nmoTplJnor6/kuI3kvJrop6blj5Hor6Xmlrnms5XjgIJcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtFcnJvcn0gZXJyIFxyXG4gICAgICogQHBhcmFtIHtTZXJ2aWNlTW9kdWxlfSBzZXJ2aWNlIOWPkeeUn+mUmeivr+eahOacjeWKoeWunuS+i1xyXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlclxyXG4gICAgICovXHJcbiAgICBvbkVycm9yKGVycjogRXJyb3IsIHNlcnZpY2U6IFNlcnZpY2VNb2R1bGUpIHtcclxuICAgICAgICBsb2cuZShzZXJ2aWNlLm5hbWUsICflj5HnlJ/plJnor6/vvJonLCBlcnIpO1xyXG4gICAgfVxyXG59Il19
