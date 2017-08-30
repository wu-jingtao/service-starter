"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events = require("events");
const http = require("http");
const fs = require("fs-extra");
const RegisteredService_1 = require("../RegisteredService/RegisteredService");
const Log_1 = require("../Log");
const ServicesManagerStatus_1 = require("./ServicesManagerStatus");
/**
 * 服务管理器
 *
 * @export
 * @class ServicesManager
 * @extends {events.EventEmitter}
 */
class ServicesManager extends events.EventEmitter {
    constructor(config = {}) {
        super();
        this._status = ServicesManagerStatus_1.ServicesManagerStatus.stopped;
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
         * @param exitCode 程序退出状态码。 1是系统错误
         */
        this.stop = (exitCode = 0) => setImmediate(this._stop.bind(this), exitCode);
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
            //要被监听的端口
            const port = "/tmp/service_starter_health_checking.sock";
            //删除之前的接口，避免被占用
            fs.removeSync(port);
            http.createServer(async (req, res) => {
                //服务还未启动时直接返回成功
                if (this._status !== ServicesManagerStatus_1.ServicesManagerStatus.running)
                    return res.end('0');
                let result;
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
                }
                else {
                    res.end(`[${result[1].service.name}]  ${result[0]}`);
                }
            }).listen(port, (err) => {
                if (err) {
                    Log_1.log.e('ServicesManager：健康检查server启动失败：', err);
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
        //确保不会重复启动
        if (this._status === ServicesManagerStatus_1.ServicesManagerStatus.starting || this._status === ServicesManagerStatus_1.ServicesManagerStatus.running)
            return;
        Log_1.log.l(this.name, '开始启动服务');
        this._status = ServicesManagerStatus_1.ServicesManagerStatus.starting;
        for (let item of this.services.values()) {
            const failed = await item.start();
            if (failed === false) {
                this.stop(1);
                return;
            }
        }
        Log_1.log.l('所有服务已启动');
        this._status = ServicesManagerStatus_1.ServicesManagerStatus.running;
        this.emit('started');
    }
    async _stop(exitCode) {
        //确保不会重复关闭
        if (this._status === ServicesManagerStatus_1.ServicesManagerStatus.stopped || this._status === ServicesManagerStatus_1.ServicesManagerStatus.stopping)
            return;
        Log_1.log.l(this.name, '开始停止服务');
        this._status = ServicesManagerStatus_1.ServicesManagerStatus.stopping;
        for (let item of Array.from(this.services.values()).reverse()) {
            await item.stop();
        }
        Log_1.log.l('所有服务已停止');
        this._status = ServicesManagerStatus_1.ServicesManagerStatus.stopped;
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
    registerService(serviceModule) {
        if (this.services.has(serviceModule.name)) {
            throw new Error(`服务'${serviceModule.name}'已注册过了`);
        }
        else {
            this.services.set(serviceModule.name, new RegisteredService_1.RegisteredService(serviceModule, this));
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
//ServicesManager是否已经创建了（一个进程只允许创建一个ServicesManager）
ServicesManager._servicesManagerCreated = false;
exports.ServicesManager = ServicesManager;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VzTWFuYWdlci9TZXJ2aWNlc01hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBa0M7QUFDbEMsNkJBQThCO0FBQzlCLCtCQUFnQztBQUVoQyw4RUFBMkU7QUFDM0UsZ0NBQTZCO0FBRzdCLG1FQUFnRTtBQUVoRTs7Ozs7O0dBTUc7QUFDSCxxQkFBNkIsU0FBUSxNQUFNLENBQUMsWUFBWTtJQTJCcEQsWUFBWSxTQUFnQyxFQUFFO1FBQzFDLEtBQUssRUFBRSxDQUFDO1FBakJKLFlBQU8sR0FBMEIsNkNBQXFCLENBQUMsT0FBTyxDQUFDO1FBU3ZFOzs7O1dBSUc7UUFDTSxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQTZCLENBQUE7UUE0RXhEOzs7O1dBSUc7UUFDSCxVQUFLLEdBQUcsTUFBTSxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLHFCQUFxQjtRQXFCekU7Ozs7O1dBS0c7UUFDSCxTQUFJLEdBQUcsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxLQUFLLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQXZHbkUsRUFBRSxDQUFDLENBQUMsZUFBZSxDQUFDLHVCQUF1QixDQUFDO1lBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQyxDQUFDO1FBQ25GLGVBQWUsQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUM7UUFFL0MsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLEdBQVU7WUFDeEMsU0FBRyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUVoQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsNEJBQTRCLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxDQUFD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QUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN0QyxDQUFDOztBQTlLRCxvREFBb0Q7QUFDckMsdUNBQXVCLEdBQUcsS0FBSyxDQUFDO0FBSG5ELDBDQWlMQyIsImZpbGUiOiJTZXJ2aWNlc01hbmFnZXIvU2VydmljZXNNYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuaW1wb3J0IGh0dHAgPSByZXF1aXJlKCdodHRwJyk7XG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuXG5pbXBvcnQgeyBSZWdpc3RlcmVkU2VydmljZSB9IGZyb20gJy4uL1JlZ2lzdGVyZWRTZXJ2aWNlL1JlZ2lzdGVyZWRTZXJ2aWNlJztcbmltcG9ydCB7IGxvZyB9IGZyb20gJy4uL0xvZyc7XG5pbXBvcnQgeyBTZXJ2aWNlTW9kdWxlIH0gZnJvbSBcIi4uL1NlcnZpY2VNb2R1bGUvU2VydmljZU1vZHVsZVwiO1xuaW1wb3J0IHsgU2VydmljZXNNYW5hZ2VyQ29uZmlnIH0gZnJvbSBcIi4vU2VydmljZXNNYW5hZ2VyQ29uZmlnXCI7XG5pbXBvcnQgeyBTZXJ2aWNlc01hbmFnZXJTdGF0dXMgfSBmcm9tIFwiLi9TZXJ2aWNlc01hbmFnZXJTdGF0dXNcIjtcblxuLyoqXG4gKiDmnI3liqHnrqHnkIblmahcbiAqIFxuICogQGV4cG9ydFxuICogQGNsYXNzIFNlcnZpY2VzTWFuYWdlclxuICogQGV4dGVuZHMge2V2ZW50cy5FdmVudEVtaXR0ZXJ9XG4gKi9cbmV4cG9ydCBjbGFzcyBTZXJ2aWNlc01hbmFnZXIgZXh0ZW5kcyBldmVudHMuRXZlbnRFbWl0dGVyIHtcblxuICAgIC8vU2VydmljZXNNYW5hZ2Vy5piv5ZCm5bey57uP5Yib5bu65LqG77yI5LiA5Liq6L+b56iL5Y+q5YWB6K645Yib5bu65LiA5LiqU2VydmljZXNNYW5hZ2Vy77yJXG4gICAgcHJpdmF0ZSBzdGF0aWMgX3NlcnZpY2VzTWFuYWdlckNyZWF0ZWQgPSBmYWxzZTtcblxuICAgIC8qKlxuICAgICAqIOi/kOihjOeKtuaAgVxuICAgICAqL1xuICAgIGdldCBzdGF0dXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXM7XG4gICAgfVxuICAgIHByaXZhdGUgX3N0YXR1czogU2VydmljZXNNYW5hZ2VyU3RhdHVzID0gU2VydmljZXNNYW5hZ2VyU3RhdHVzLnN0b3BwZWQ7XG5cbiAgICAvKipcbiAgICAgKiBTZXJ2aWNlc01hbmFnZXIg55qE5ZCN56ew77yM6buY6K6k5piv57G75ZCN44CCXG4gICAgICovXG4gICAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDms6jlhoznmoTmnI3liqHliJfooajjgIIo5pyN5Yqh5Y+q5bqU5b2T6YCa6L+HcmVnaXN0ZXJTZXJ2aWNl5p2l6L+b6KGM5rOo5YaMKVxuICAgICAqIFxuICAgICAqIGtleeaYr+acjeWKoeWQjeensFxuICAgICAqL1xuICAgIHJlYWRvbmx5IHNlcnZpY2VzID0gbmV3IE1hcDxzdHJpbmcsIFJlZ2lzdGVyZWRTZXJ2aWNlPigpXG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IFNlcnZpY2VzTWFuYWdlckNvbmZpZyA9IHt9KSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgaWYgKFNlcnZpY2VzTWFuYWdlci5fc2VydmljZXNNYW5hZ2VyQ3JlYXRlZCkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMubmFtZX3lt7Lnu4/ooqvliJvlu7rkuoZgKTtcbiAgICAgICAgU2VydmljZXNNYW5hZ2VyLl9zZXJ2aWNlc01hbmFnZXJDcmVhdGVkID0gdHJ1ZTtcblxuICAgICAgICBwcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgbG9nLmUoJ+eoi+W6j+WHuueOsOacquaNleaNiVByb21pc2XlvILluLjvvJonLCBlcnIpO1xuXG4gICAgICAgICAgICBpZiAoY29uZmlnLnN0b3BPbkhhdmVVbmhhbmRsZWRSZWplY3Rpb24gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBwcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICBsb2cuZSgn56iL5bqP5Ye6546w5pyq5o2V5o2J5byC5bi477yaJywgZXJyKTtcblxuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlVW5jYXVnaHRFeGNlcHRpb24gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBwcm9jZXNzLm9uKCdTSUdURVJNJywgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlU0lHVEVSTSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcHJvY2Vzcy5vbignU0lHSU5UJywgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlU0lHSU5UICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvL+mFjee9ruWBpeW6t+ajgOafpeacjeWKoVxuICAgICAgICBpZiAoY29uZmlnLnN0YXJ0SGVhbHRoQ2hlY2tpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAvL+imgeiiq+ebkeWQrOeahOerr+WPo1xuICAgICAgICAgICAgY29uc3QgcG9ydCA9IFwiL3RtcC9zZXJ2aWNlX3N0YXJ0ZXJfaGVhbHRoX2NoZWNraW5nLnNvY2tcIjtcblxuICAgICAgICAgICAgLy/liKDpmaTkuYvliY3nmoTmjqXlj6PvvIzpgb/lhY3ooqvljaDnlKhcbiAgICAgICAgICAgIGZzLnJlbW92ZVN5bmMocG9ydCk7XG5cbiAgICAgICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFzeW5jIChyZXEsIHJlcykgPT4ge1xuXG4gICAgICAgICAgICAgICAgLy/mnI3liqHov5jmnKrlkK/liqjml7bnm7TmjqXov5Tlm57miJDlip9cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3RhdHVzICE9PSBTZXJ2aWNlc01hbmFnZXJTdGF0dXMucnVubmluZykgcmV0dXJuIHJlcy5lbmQoJzAnKTtcblxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQ6IFtFcnJvciwgUmVnaXN0ZXJlZFNlcnZpY2VdIHwgdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgLy/mo4Dmn6Xmr4/kuIDkuKrmnI3liqHnmoTlgaXlurfnirblhrVcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRoaXMuc2VydmljZXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYXdhaXQgaXRlbS5oZWFsdGhDaGVjaygpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8v5LiN5Li656m65bCx6KGo56S65pyJ6Zeu6aKY5LqGXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gW2VyciwgaXRlbV07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXMuZW5kKCcwJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLmVuZChgWyR7cmVzdWx0WzFdLnNlcnZpY2UubmFtZX1dICAke3Jlc3VsdFswXX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5saXN0ZW4ocG9ydCwgKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZy5lKCdTZXJ2aWNlc01hbmFnZXLvvJrlgaXlurfmo4Dmn6VzZXJ2ZXLlkK/liqjlpLHotKXvvJonLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlkK/liqjmiYDmnInms6jlhoznmoTmnI3liqHjgILmjInnhafms6jlhoznmoTlhYjlkI7pobrluo/mnaXlkK/liqjmnI3liqHjgILlhYjms6jlhoznmoTmnI3liqHlhYjlkK/liqjjgIIgICAgIFxuICAgICAqIOWmguaenOWQr+WKqOi/h+eoi+S4reafkOS4quacjeWKoeWHuueOsOW8guW4uO+8jOWImeWQjumdoueahOacjeWKoeWImeS4jeWGjeiiq+WQr+WKqO+8jOS5i+WJjeWQr+WKqOi/h+S6hueahOacjeWKoeS5n+S8muiiq+S+neasoeWFs+mXre+8iOaMieeFp+S7juWQjuWQkeWJjeeahOmhuuW6j++8ieOAgiAgICAgXG4gICAgICog5ZCv5Yqo57uT5p2f5ZCO5Lya6Kem5Y+Rc3RhcnRlZOS6i+S7tlxuICAgICAqL1xuICAgIHN0YXJ0ID0gKCkgPT4gc2V0SW1tZWRpYXRlKHRoaXMuX3N0YXJ0LmJpbmQodGhpcykpOyAvL+S4u+imgeaYr+S4uuS6huetieW+heaehOmAoOWHveaVsOS4reeahOS6i+S7tue7keWumuWujOaIkFxuICAgIHByaXZhdGUgYXN5bmMgX3N0YXJ0KCkge1xuICAgICAgICAvL+ehruS/neS4jeS8mumHjeWkjeWQr+WKqFxuICAgICAgICBpZiAodGhpcy5fc3RhdHVzID09PSBTZXJ2aWNlc01hbmFnZXJTdGF0dXMuc3RhcnRpbmcgfHwgdGhpcy5fc3RhdHVzID09PSBTZXJ2aWNlc01hbmFnZXJTdGF0dXMucnVubmluZykgcmV0dXJuO1xuXG4gICAgICAgIGxvZy5sKHRoaXMubmFtZSwgJ+W8gOWni+WQr+WKqOacjeWKoScpO1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSBTZXJ2aWNlc01hbmFnZXJTdGF0dXMuc3RhcnRpbmc7XG5cbiAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLnNlcnZpY2VzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBjb25zdCBmYWlsZWQgPSBhd2FpdCBpdGVtLnN0YXJ0KCk7XG4gICAgICAgICAgICBpZiAoZmFpbGVkID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgxKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsb2cubCgn5omA5pyJ5pyN5Yqh5bey5ZCv5YqoJyk7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IFNlcnZpY2VzTWFuYWdlclN0YXR1cy5ydW5uaW5nO1xuICAgICAgICB0aGlzLmVtaXQoJ3N0YXJ0ZWQnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlhbPpl63miYDmnInlt7LlkK/liqjnmoTmnI3liqHjgILlhYjms6jlhoznmoTmnI3liqHmnIDlkI7ooqvlhbPpl63jgILlvZPmiYDmnInmnI3liqHpg73ooqvlhbPpl63lkI7lsIbkvJrpgIDlh7rnqIvluo/jgIJcbiAgICAgKiDlvZPmiYDmnInmnI3liqHpg73lgZzmraLlkI7lh7rlj5FzdG9wcGVk5LqL5Lu2XG4gICAgICogXG4gICAgICogQHBhcmFtIGV4aXRDb2RlIOeoi+W6j+mAgOWHuueKtuaAgeeggeOAgiAx5piv57O757uf6ZSZ6K+vXG4gICAgICovXG4gICAgc3RvcCA9IChleGl0Q29kZSA9IDApID0+IHNldEltbWVkaWF0ZSh0aGlzLl9zdG9wLmJpbmQodGhpcyksIGV4aXRDb2RlKTtcbiAgICBwcml2YXRlIGFzeW5jIF9zdG9wKGV4aXRDb2RlOiBudW1iZXIpIHtcbiAgICAgICAgLy/noa7kv53kuI3kvJrph43lpI3lhbPpl61cbiAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyA9PT0gU2VydmljZXNNYW5hZ2VyU3RhdHVzLnN0b3BwZWQgfHwgdGhpcy5fc3RhdHVzID09PSBTZXJ2aWNlc01hbmFnZXJTdGF0dXMuc3RvcHBpbmcpIHJldHVybjtcblxuICAgICAgICBsb2cubCh0aGlzLm5hbWUsICflvIDlp4vlgZzmraLmnI3liqEnKTtcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gU2VydmljZXNNYW5hZ2VyU3RhdHVzLnN0b3BwaW5nO1xuXG4gICAgICAgIGZvciAobGV0IGl0ZW0gb2YgQXJyYXkuZnJvbSh0aGlzLnNlcnZpY2VzLnZhbHVlcygpKS5yZXZlcnNlKCkpIHtcbiAgICAgICAgICAgIGF3YWl0IGl0ZW0uc3RvcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgbG9nLmwoJ+aJgOacieacjeWKoeW3suWBnOatoicpO1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSBTZXJ2aWNlc01hbmFnZXJTdGF0dXMuc3RvcHBlZDtcbiAgICAgICAgdGhpcy5lbWl0KCdzdG9wcGVkJyk7XG5cbiAgICAgICAgLy/pgIDlh7rmnI3liqFcbiAgICAgICAgcHJvY2Vzcy5leGl0KGV4aXRDb2RlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDms6jlhozmnI3liqFcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1NlcnZpY2VNb2R1bGV9IHNlcnZpY2VNb2R1bGUg5pyN5Yqh5qih5Z2X5a6e5L6LXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlclxuICAgICAqL1xuICAgIHJlZ2lzdGVyU2VydmljZShzZXJ2aWNlTW9kdWxlOiBTZXJ2aWNlTW9kdWxlKSB7XG4gICAgICAgIGlmICh0aGlzLnNlcnZpY2VzLmhhcyhzZXJ2aWNlTW9kdWxlLm5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOacjeWKoScke3NlcnZpY2VNb2R1bGUubmFtZX0n5bey5rOo5YaM6L+H5LqGYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNlcnZpY2VzLnNldChzZXJ2aWNlTW9kdWxlLm5hbWUsIG5ldyBSZWdpc3RlcmVkU2VydmljZShzZXJ2aWNlTW9kdWxlLCB0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmnI3liqHov5DooYzov4fnqIvkuK3nmoTplJnor6/lpITnkIbmlrnms5XjgILmnI3liqHlkK/liqjmiJblhbPpl63ov4fnqIvkuK3kuqfnlJ/nmoTplJnor6/kuI3kvJrop6blj5Hor6Xmlrnms5XjgIJcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBlcnIgXG4gICAgICogQHBhcmFtIHtTZXJ2aWNlTW9kdWxlfSBzZXJ2aWNlIOWPkeeUn+mUmeivr+eahOacjeWKoeWunuS+i1xuICAgICAqIEBtZW1iZXJvZiBTZXJ2aWNlc01hbmFnZXJcbiAgICAgKi9cbiAgICBvbkVycm9yKGVycjogRXJyb3IsIHNlcnZpY2U6IFNlcnZpY2VNb2R1bGUpIHtcbiAgICAgICAgbG9nLmUoc2VydmljZS5uYW1lLCAn5Y+R55Sf6ZSZ6K+v77yaJywgZXJyKTtcbiAgICB9XG59Il19
