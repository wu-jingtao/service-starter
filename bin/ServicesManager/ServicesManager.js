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
    constructor(config = {}) {
        super();
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
         * @param exitCode 程序退出状态码。 1是系统错误 2用户服务错误
         */
        this.stop = (exitCode = 0) => setImmediate(this._stop.bind(this), exitCode);
        if (ServicesManager._servicesManagerCreated)
            throw new Error(`${this.name}已经被创建了`);
        ServicesManager._servicesManagerCreated = true;
        process.on('unhandledRejection', (err) => {
            Log_1.log.e('程序出现未捕捉Promise异常：', err);
            if (config.stopOnHaveUnhandledRejection !== false) {
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
            Log_1.log.e('程序出现未捕捉异常：', err);
            if (config.stopOnHaveUncaughtException !== false) {
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
        process.on('SIGTERM', () => {
            if (config.stopOnHaveSIGTERM !== false) {
                if (this._status !== RunningStatus_1.RunningStatus.stopping) {
                    if (this._status === RunningStatus_1.RunningStatus.stopped) {
                        process.exit();
                    }
                    else {
                        this.stop();
                    }
                }
            }
        });
        process.on('SIGINT', () => {
            if (config.stopOnHaveSIGINT !== false) {
                if (this._status !== RunningStatus_1.RunningStatus.stopping) {
                    if (this._status === RunningStatus_1.RunningStatus.stopped) {
                        process.exit();
                    }
                    else {
                        this.stop();
                    }
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
                if (this._status !== RunningStatus_1.RunningStatus.running)
                    return res.end('0');
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
        //确保只有在stopped的情况下才能执行start
        if (this._status !== RunningStatus_1.RunningStatus.stopped) {
            throw new Error(`[服务管理器：${this.name}] 在还未完全关闭的情况下又再次被启动。当前的状态为：${RunningStatus_1.RunningStatus[this._status]}`);
        }
        Log_1.log.l(this.name, '开始启动服务');
        this._status = RunningStatus_1.RunningStatus.starting;
        for (let item of this.services.values()) {
            const failed = await item._start();
            //不为空则表示启动失败
            if (failed !== undefined) {
                return this.stop(2);
            }
        }
        Log_1.log.l('所有服务已启动');
        this._status = RunningStatus_1.RunningStatus.running;
        this.emit('started');
    }
    async _stop(exitCode) {
        //确保不会重复停止
        if (this._status === RunningStatus_1.RunningStatus.stopping || this._status === RunningStatus_1.RunningStatus.stopped) {
            throw new Error(`[服务管理器：${this.name}] 在处于正在停止或已停止的状态下又再次被停止。当前的状态为：${RunningStatus_1.RunningStatus[this._status]}`);
        }
        Log_1.log.l(this.name, '开始停止服务');
        this._status = RunningStatus_1.RunningStatus.stopping;
        for (let item of Array.from(this.services.values()).reverse()) {
            if (item.status !== RunningStatus_1.RunningStatus.stopping && item.status !== RunningStatus_1.RunningStatus.stopped)
                await item._stop();
        }
        Log_1.log.l('所有服务已停止');
        this._status = RunningStatus_1.RunningStatus.stopped;
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
     * 注意：onError中的代码不应出现错误，如果onError的中的代码出现错误将直接导致程序关闭。
     *
     * @param {Error} err
     * @param {ServiceModule} service 发生错误的服务实例
     * @memberof ServicesManager
     */
    onError(err, service) {
        Log_1.log.e(service.name, '发生错误：', err);
    }
}
//ServicesManager是否已经创建了（一个容器只允许创建一个ServicesManager）
ServicesManager._servicesManagerCreated = false;
exports.ServicesManager = ServicesManager;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VzTWFuYWdlci9TZXJ2aWNlc01hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBa0M7QUFDbEMsNkJBQThCO0FBQzlCLCtCQUFnQztBQUVoQyw4RUFBMkU7QUFDM0UsZ0NBQTZCO0FBRzdCLG9EQUFpRDtBQUVqRDs7Ozs7O0dBTUc7QUFDSCxxQkFBNkIsU0FBUSxNQUFNLENBQUMsWUFBWTtJQTJCcEQsWUFBWSxTQUFnQyxFQUFFO1FBQzFDLEtBQUssRUFBRSxDQUFDO1FBakJKLFlBQU8sR0FBa0IsNkJBQWEsQ0FBQyxPQUFPLENBQUM7UUFTdkQ7Ozs7V0FJRztRQUNNLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQTtRQXNHeEQ7Ozs7V0FJRztRQUNILFVBQUssR0FBRyxNQUFNLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMscUJBQXFCO1FBd0J6RTs7Ozs7V0FLRztRQUNILFNBQUksR0FBRyxDQUFDLFFBQVEsR0FBRyxDQUFDLEtBQUssWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBcEluRSxFQUFFLENBQUMsQ0FBQyxlQUFlLENBQUMsdUJBQXVCLENBQUM7WUFBQyxNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksUUFBUSxDQUFDLENBQUM7UUFDbkYsZUFBZSxDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQztRQUUvQyxPQUFPLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLENBQUMsR0FBVTtZQUN4QyxTQUFHLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRWhDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyw0QkFBNEIsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxVQUFVO2dCQUNW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QUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLGFBQWEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxxQ0FBaUIsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN0RixDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxPQUFPLENBQUMsR0FBVSxFQUFFLE9BQXNCO1FBQ3RDLFNBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDdEMsQ0FBQzs7QUEvTUQsb0RBQW9EO0FBQ3JDLHVDQUF1QixHQUFHLEtBQUssQ0FBQztBQUhuRCwwQ0FrTkMiLCJmaWxlIjoiU2VydmljZXNNYW5hZ2VyL1NlcnZpY2VzTWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBldmVudHMgPSByZXF1aXJlKCdldmVudHMnKTtcbmltcG9ydCBodHRwID0gcmVxdWlyZSgnaHR0cCcpO1xuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcblxuaW1wb3J0IHsgUmVnaXN0ZXJlZFNlcnZpY2UgfSBmcm9tICcuLi9SZWdpc3RlcmVkU2VydmljZS9SZWdpc3RlcmVkU2VydmljZSc7XG5pbXBvcnQgeyBsb2cgfSBmcm9tICcuLi9Mb2cnO1xuaW1wb3J0IHsgU2VydmljZU1vZHVsZSB9IGZyb20gXCIuLi9TZXJ2aWNlTW9kdWxlL1NlcnZpY2VNb2R1bGVcIjtcbmltcG9ydCB7IFNlcnZpY2VzTWFuYWdlckNvbmZpZyB9IGZyb20gXCIuL1NlcnZpY2VzTWFuYWdlckNvbmZpZ1wiO1xuaW1wb3J0IHsgUnVubmluZ1N0YXR1cyB9IGZyb20gXCIuLi9SdW5uaW5nU3RhdHVzXCI7XG5cbi8qKlxuICog5pyN5Yqh566h55CG5ZmoXG4gKiBcbiAqIEBleHBvcnRcbiAqIEBjbGFzcyBTZXJ2aWNlc01hbmFnZXJcbiAqIEBleHRlbmRzIHtldmVudHMuRXZlbnRFbWl0dGVyfVxuICovXG5leHBvcnQgY2xhc3MgU2VydmljZXNNYW5hZ2VyIGV4dGVuZHMgZXZlbnRzLkV2ZW50RW1pdHRlciB7XG5cbiAgICAvL1NlcnZpY2VzTWFuYWdlcuaYr+WQpuW3sue7j+WIm+W7uuS6hu+8iOS4gOS4quWuueWZqOWPquWFgeiuuOWIm+W7uuS4gOS4qlNlcnZpY2VzTWFuYWdlcu+8iVxuICAgIHByaXZhdGUgc3RhdGljIF9zZXJ2aWNlc01hbmFnZXJDcmVhdGVkID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiDov5DooYznirbmgIFcbiAgICAgKi9cbiAgICBnZXQgc3RhdHVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzO1xuICAgIH1cbiAgICBwcml2YXRlIF9zdGF0dXM6IFJ1bm5pbmdTdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQ7XG5cbiAgICAvKipcbiAgICAgKiBTZXJ2aWNlc01hbmFnZXIg55qE5ZCN56ew77yM6buY6K6k5piv57G75ZCN44CCXG4gICAgICovXG4gICAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDms6jlhoznmoTmnI3liqHliJfooajjgIIo5pyN5Yqh5Y+q5bqU5b2T6YCa6L+HcmVnaXN0ZXJTZXJ2aWNl5p2l6L+b6KGM5rOo5YaMKVxuICAgICAqIFxuICAgICAqIGtleeaYr+acjeWKoeWQjeensFxuICAgICAqL1xuICAgIHJlYWRvbmx5IHNlcnZpY2VzID0gbmV3IE1hcDxzdHJpbmcsIFJlZ2lzdGVyZWRTZXJ2aWNlPigpXG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IFNlcnZpY2VzTWFuYWdlckNvbmZpZyA9IHt9KSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgaWYgKFNlcnZpY2VzTWFuYWdlci5fc2VydmljZXNNYW5hZ2VyQ3JlYXRlZCkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMubmFtZX3lt7Lnu4/ooqvliJvlu7rkuoZgKTtcbiAgICAgICAgU2VydmljZXNNYW5hZ2VyLl9zZXJ2aWNlc01hbmFnZXJDcmVhdGVkID0gdHJ1ZTtcblxuICAgICAgICBwcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgbG9nLmUoJ+eoi+W6j+WHuueOsOacquaNleaNiVByb21pc2XlvILluLjvvJonLCBlcnIpO1xuXG4gICAgICAgICAgICBpZiAoY29uZmlnLnN0b3BPbkhhdmVVbmhhbmRsZWRSZWplY3Rpb24gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgLy/noa7kv53kuI3kvJrph43lpI3lhbPpl61cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3RhdHVzICE9PSBSdW5uaW5nU3RhdHVzLnN0b3BwaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8v5aaC5p6c5pyN5Yqh6L+Y5pyq5ZCv5Yqo6L+HXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0dXMgPT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdG9wKDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBwcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICBsb2cuZSgn56iL5bqP5Ye6546w5pyq5o2V5o2J5byC5bi477yaJywgZXJyKTtcblxuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlVW5jYXVnaHRFeGNlcHRpb24gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5zdG9wcGluZykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3RhdHVzID09PSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcHJvY2Vzcy5vbignU0lHVEVSTScsICgpID0+IHtcbiAgICAgICAgICAgIGlmIChjb25maWcuc3RvcE9uSGF2ZVNJR1RFUk0gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5zdG9wcGluZykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3RhdHVzID09PSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHByb2Nlc3Mub24oJ1NJR0lOVCcsICgpID0+IHtcbiAgICAgICAgICAgIGlmIChjb25maWcuc3RvcE9uSGF2ZVNJR0lOVCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3RhdHVzICE9PSBSdW5uaW5nU3RhdHVzLnN0b3BwaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0dXMgPT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy/phY3nva7lgaXlurfmo4Dmn6XmnI3liqFcbiAgICAgICAgaWYgKGNvbmZpZy5zdGFydEhlYWx0aENoZWNraW5nICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgLy/opoHooqvnm5HlkKznmoTnq6/lj6NcbiAgICAgICAgICAgIGNvbnN0IHBvcnQgPSBcIi90bXAvc2VydmljZV9zdGFydGVyX2hlYWx0aF9jaGVja2luZy5zb2NrXCI7XG5cbiAgICAgICAgICAgIC8v5Yig6Zmk5LmL5YmN55qE56uv5Y+j77yM6YG/5YWN6KKr5Y2g55SoXG4gICAgICAgICAgICBmcy5yZW1vdmVTeW5jKHBvcnQpO1xuXG4gICAgICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcihhc3luYyAocmVxLCByZXMpID0+IHtcblxuICAgICAgICAgICAgICAgIC8v5pyN5Yqh6L+Y5pyq5aSE5LqOcnVubmluZ+aXtuebtOaOpei/lOWbnuaIkOWKn1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMucnVubmluZykgcmV0dXJuIHJlcy5lbmQoJzAnKTtcblxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQ6IFtFcnJvciwgUmVnaXN0ZXJlZFNlcnZpY2VdIHwgdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgLy/mo4Dmn6Xmr4/kuIDkuKrmnI3liqHnmoTlgaXlurfnirblhrVcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRoaXMuc2VydmljZXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYXdhaXQgaXRlbS5faGVhbHRoQ2hlY2soKTtcblxuICAgICAgICAgICAgICAgICAgICAvL+S4jeS4uuepuuWwseihqOekuuaciemXrumimOS6hlxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtlcnIsIGl0ZW1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLmVuZCgnMCcpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoYFske3Jlc3VsdFsxXS5zZXJ2aWNlLm5hbWV9XSAgJHtyZXN1bHRbMF19YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkubGlzdGVuKHBvcnQsIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBsb2cuZSgnU2VydmljZXNNYW5hZ2Vy77ya5YGl5bq35qOA5p+lc2VydmVy5ZCv5Yqo5aSx6LSl77yaJywgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5ZCv5Yqo5omA5pyJ5rOo5YaM55qE5pyN5Yqh44CC5oyJ54Wn5rOo5YaM55qE5YWI5ZCO6aG65bqP5p2l5ZCv5Yqo5pyN5Yqh44CC5YWI5rOo5YaM55qE5pyN5Yqh5YWI5ZCv5Yqo44CCICAgICBcbiAgICAgKiDlpoLmnpzlkK/liqjov4fnqIvkuK3mn5DkuKrmnI3liqHlh7rnjrDlvILluLjvvIzliJnlkI7pnaLnmoTmnI3liqHliJnkuI3lho3ooqvlkK/liqjvvIzkuYvliY3lkK/liqjov4fkuobnmoTmnI3liqHkuZ/kvJrooqvkvp3mrKHlhbPpl63vvIjmjInnhafku47lkI7lkJHliY3nmoTpobrluo/vvInjgIIgICAgIFxuICAgICAqIOWQr+WKqOe7k+adn+WQjuS8muinpuWPkXN0YXJ0ZWTkuovku7ZcbiAgICAgKi9cbiAgICBzdGFydCA9ICgpID0+IHNldEltbWVkaWF0ZSh0aGlzLl9zdGFydC5iaW5kKHRoaXMpKTsgLy/kuLvopoHmmK/kuLrkuobnrYnlvoXmnoTpgKDlh73mlbDkuK3nmoTkuovku7bnu5HlrprlrozmiJBcbiAgICBwcml2YXRlIGFzeW5jIF9zdGFydCgpIHtcbiAgICAgICAgLy/noa7kv53lj6rmnInlnKhzdG9wcGVk55qE5oOF5Ya15LiL5omN6IO95omn6KGMc3RhcnRcbiAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5zdG9wcGVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFvmnI3liqHnrqHnkIblmajvvJoke3RoaXMubmFtZX1dIOWcqOi/mOacquWujOWFqOWFs+mXreeahOaDheWGteS4i+WPiOWGjeasoeiiq+WQr+WKqOOAguW9k+WJjeeahOeKtuaAgeS4uu+8miR7UnVubmluZ1N0YXR1c1t0aGlzLl9zdGF0dXNdfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgbG9nLmwodGhpcy5uYW1lLCAn5byA5aeL5ZCv5Yqo5pyN5YqhJyk7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMuc3RhcnRpbmc7XG5cbiAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLnNlcnZpY2VzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBjb25zdCBmYWlsZWQgPSBhd2FpdCBpdGVtLl9zdGFydCgpO1xuXG4gICAgICAgICAgICAvL+S4jeS4uuepuuWImeihqOekuuWQr+WKqOWksei0pVxuICAgICAgICAgICAgaWYgKGZhaWxlZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RvcCgyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxvZy5sKCfmiYDmnInmnI3liqHlt7LlkK/liqgnKTtcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gUnVubmluZ1N0YXR1cy5ydW5uaW5nO1xuICAgICAgICB0aGlzLmVtaXQoJ3N0YXJ0ZWQnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlhbPpl63miYDmnInlt7LlkK/liqjnmoTmnI3liqHjgILlhYjms6jlhoznmoTmnI3liqHmnIDlkI7ooqvlhbPpl63jgILlvZPmiYDmnInmnI3liqHpg73ooqvlhbPpl63lkI7lsIbkvJrpgIDlh7rnqIvluo/jgIJcbiAgICAgKiDlvZPmiYDmnInmnI3liqHpg73lgZzmraLlkI7lh7rlj5FzdG9wcGVk5LqL5Lu2XG4gICAgICogXG4gICAgICogQHBhcmFtIGV4aXRDb2RlIOeoi+W6j+mAgOWHuueKtuaAgeeggeOAgiAx5piv57O757uf6ZSZ6K+vIDLnlKjmiLfmnI3liqHplJnor69cbiAgICAgKi9cbiAgICBzdG9wID0gKGV4aXRDb2RlID0gMCkgPT4gc2V0SW1tZWRpYXRlKHRoaXMuX3N0b3AuYmluZCh0aGlzKSwgZXhpdENvZGUpO1xuICAgIHByaXZhdGUgYXN5bmMgX3N0b3AoZXhpdENvZGU6IG51bWJlcikge1xuICAgICAgICAvL+ehruS/neS4jeS8mumHjeWkjeWBnOatolxuICAgICAgICBpZiAodGhpcy5fc3RhdHVzID09PSBSdW5uaW5nU3RhdHVzLnN0b3BwaW5nIHx8IHRoaXMuX3N0YXR1cyA9PT0gUnVubmluZ1N0YXR1cy5zdG9wcGVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFvmnI3liqHnrqHnkIblmajvvJoke3RoaXMubmFtZX1dIOWcqOWkhOS6juato+WcqOWBnOatouaIluW3suWBnOatoueahOeKtuaAgeS4i+WPiOWGjeasoeiiq+WBnOatouOAguW9k+WJjeeahOeKtuaAgeS4uu+8miR7UnVubmluZ1N0YXR1c1t0aGlzLl9zdGF0dXNdfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgbG9nLmwodGhpcy5uYW1lLCAn5byA5aeL5YGc5q2i5pyN5YqhJyk7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMuc3RvcHBpbmc7XG5cbiAgICAgICAgZm9yIChsZXQgaXRlbSBvZiBBcnJheS5mcm9tKHRoaXMuc2VydmljZXMudmFsdWVzKCkpLnJldmVyc2UoKSkge1xuICAgICAgICAgICAgaWYgKGl0ZW0uc3RhdHVzICE9PSBSdW5uaW5nU3RhdHVzLnN0b3BwaW5nICYmIGl0ZW0uc3RhdHVzICE9PSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQpXG4gICAgICAgICAgICAgICAgYXdhaXQgaXRlbS5fc3RvcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgbG9nLmwoJ+aJgOacieacjeWKoeW3suWBnOatoicpO1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQ7XG4gICAgICAgIHRoaXMuZW1pdCgnc3RvcHBlZCcpO1xuXG4gICAgICAgIC8v6YCA5Ye65pyN5YqhXG4gICAgICAgIHByb2Nlc3MuZXhpdChleGl0Q29kZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5rOo5YaM5pyN5YqhXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTZXJ2aWNlTW9kdWxlfSBzZXJ2aWNlTW9kdWxlIOacjeWKoeaooeWdl+WunuS+i1xuICAgICAqIEBtZW1iZXJvZiBTZXJ2aWNlc01hbmFnZXJcbiAgICAgKi9cbiAgICByZWdpc3RlclNlcnZpY2Uoc2VydmljZU1vZHVsZTogU2VydmljZU1vZHVsZSkge1xuICAgICAgICBpZiAodGhpcy5zZXJ2aWNlcy5oYXMoc2VydmljZU1vZHVsZS5uYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDmnI3liqEnJHtzZXJ2aWNlTW9kdWxlLm5hbWV9J+W3suazqOWGjOi/h+S6hmApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXJ2aWNlcy5zZXQoc2VydmljZU1vZHVsZS5uYW1lLCBuZXcgUmVnaXN0ZXJlZFNlcnZpY2Uoc2VydmljZU1vZHVsZSwgdGhpcykpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5pyN5Yqh6L+Q6KGM6L+H56iL5Lit55qE6ZSZ6K+v5aSE55CG5pa55rOV44CC5pyN5Yqh5ZCv5Yqo5oiW5YWz6Zet6L+H56iL5Lit5Lqn55Sf55qE6ZSZ6K+v5LiN5Lya6Kem5Y+R6K+l5pa55rOV44CCXG4gICAgICog5rOo5oSP77yab25FcnJvcuS4reeahOS7o+eggeS4jeW6lOWHuueOsOmUmeivr++8jOWmguaenG9uRXJyb3LnmoTkuK3nmoTku6PnoIHlh7rnjrDplJnor6/lsIbnm7TmjqXlr7zoh7TnqIvluo/lhbPpl63jgIJcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBlcnIgXG4gICAgICogQHBhcmFtIHtTZXJ2aWNlTW9kdWxlfSBzZXJ2aWNlIOWPkeeUn+mUmeivr+eahOacjeWKoeWunuS+i1xuICAgICAqIEBtZW1iZXJvZiBTZXJ2aWNlc01hbmFnZXJcbiAgICAgKi9cbiAgICBvbkVycm9yKGVycjogRXJyb3IsIHNlcnZpY2U6IFNlcnZpY2VNb2R1bGUpIHtcbiAgICAgICAgbG9nLmUoc2VydmljZS5uYW1lLCAn5Y+R55Sf6ZSZ6K+v77yaJywgZXJyKTtcbiAgICB9XG59Il19
