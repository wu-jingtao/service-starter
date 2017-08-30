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
         * @param exitCode 程序退出状态码。 1是系统错误
         */
        this.stop = (exitCode = 0) => setImmediate(this._stop.bind(this), exitCode);
        if (ServicesManager._servicesManagerCreated)
            throw new Error(`${this.name}已经被创建了`);
        ServicesManager._servicesManagerCreated = true;
        process.on('unhandledRejection', (err) => {
            Log_1.log.e('程序出现未捕捉Promise异常：', err);
            if (config.stopOnHaveUnhandledRejection !== false) {
                //确保不会重复关闭
                if (this._status !== RunningStatus_1.RunningStatus.stopping && this._status !== RunningStatus_1.RunningStatus.stopped)
                    this.stop(1);
            }
        });
        process.on('uncaughtException', (err) => {
            Log_1.log.e('程序出现未捕捉异常：', err);
            if (config.stopOnHaveUncaughtException !== false) {
                //确保不会重复关闭
                if (this._status !== RunningStatus_1.RunningStatus.stopping && this._status !== RunningStatus_1.RunningStatus.stopped)
                    this.stop(1);
            }
        });
        process.on('SIGTERM', () => {
            if (config.stopOnHaveSIGTERM !== false) {
                //确保不会重复关闭
                if (this._status !== RunningStatus_1.RunningStatus.stopping && this._status !== RunningStatus_1.RunningStatus.stopped)
                    this.stop();
            }
        });
        process.on('SIGINT', () => {
            if (config.stopOnHaveSIGINT !== false) {
                //确保不会重复关闭
                if (this._status !== RunningStatus_1.RunningStatus.stopping && this._status !== RunningStatus_1.RunningStatus.stopped)
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
                this.stop(1);
                return;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VzTWFuYWdlci9TZXJ2aWNlc01hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBa0M7QUFDbEMsNkJBQThCO0FBQzlCLCtCQUFnQztBQUVoQyw4RUFBMkU7QUFDM0UsZ0NBQTZCO0FBRzdCLG9EQUFpRDtBQUVqRDs7Ozs7O0dBTUc7QUFDSCxxQkFBNkIsU0FBUSxNQUFNLENBQUMsWUFBWTtJQTJCcEQsWUFBWSxTQUFnQyxFQUFFO1FBQzFDLEtBQUssRUFBRSxDQUFDO1FBakJKLFlBQU8sR0FBa0IsNkJBQWEsQ0FBQyxPQUFPLENBQUM7UUFTdkQ7Ozs7V0FJRztRQUNNLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQTtRQW9GeEQ7Ozs7V0FJRztRQUNILFVBQUssR0FBRyxNQUFNLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMscUJBQXFCO1FBeUJ6RTs7Ozs7V0FLRztRQUNILFNBQUksR0FBRyxDQUFDLFFBQVEsR0FBRyxDQUFDLEtBQUssWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBbkhuRSxFQUFFLENBQUMsQ0FBQyxlQUFlLENBQUMsdUJBQXVCLENBQUM7WUFBQyxNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksUUFBUSxDQUFDLENBQUM7UUFDbkYsZUFBZSxDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQztRQUUvQyxPQUFPLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLENBQUMsR0FBVTtZQUN4QyxTQUFHLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRWhDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyw0QkFBNEIsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxVQUFVO2dCQUNW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Z2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuaW1wb3J0IGh0dHAgPSByZXF1aXJlKCdodHRwJyk7XG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuXG5pbXBvcnQgeyBSZWdpc3RlcmVkU2VydmljZSB9IGZyb20gJy4uL1JlZ2lzdGVyZWRTZXJ2aWNlL1JlZ2lzdGVyZWRTZXJ2aWNlJztcbmltcG9ydCB7IGxvZyB9IGZyb20gJy4uL0xvZyc7XG5pbXBvcnQgeyBTZXJ2aWNlTW9kdWxlIH0gZnJvbSBcIi4uL1NlcnZpY2VNb2R1bGUvU2VydmljZU1vZHVsZVwiO1xuaW1wb3J0IHsgU2VydmljZXNNYW5hZ2VyQ29uZmlnIH0gZnJvbSBcIi4vU2VydmljZXNNYW5hZ2VyQ29uZmlnXCI7XG5pbXBvcnQgeyBSdW5uaW5nU3RhdHVzIH0gZnJvbSBcIi4uL1J1bm5pbmdTdGF0dXNcIjtcblxuLyoqXG4gKiDmnI3liqHnrqHnkIblmahcbiAqIFxuICogQGV4cG9ydFxuICogQGNsYXNzIFNlcnZpY2VzTWFuYWdlclxuICogQGV4dGVuZHMge2V2ZW50cy5FdmVudEVtaXR0ZXJ9XG4gKi9cbmV4cG9ydCBjbGFzcyBTZXJ2aWNlc01hbmFnZXIgZXh0ZW5kcyBldmVudHMuRXZlbnRFbWl0dGVyIHtcblxuICAgIC8vU2VydmljZXNNYW5hZ2Vy5piv5ZCm5bey57uP5Yib5bu65LqG77yI5LiA5Liq5a655Zmo5Y+q5YWB6K645Yib5bu65LiA5LiqU2VydmljZXNNYW5hZ2Vy77yJXG4gICAgcHJpdmF0ZSBzdGF0aWMgX3NlcnZpY2VzTWFuYWdlckNyZWF0ZWQgPSBmYWxzZTtcblxuICAgIC8qKlxuICAgICAqIOi/kOihjOeKtuaAgVxuICAgICAqL1xuICAgIGdldCBzdGF0dXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXM7XG4gICAgfVxuICAgIHByaXZhdGUgX3N0YXR1czogUnVubmluZ1N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZDtcblxuICAgIC8qKlxuICAgICAqIFNlcnZpY2VzTWFuYWdlciDnmoTlkI3np7DvvIzpu5jorqTmmK/nsbvlkI3jgIJcbiAgICAgKi9cbiAgICBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOazqOWGjOeahOacjeWKoeWIl+ihqOOAgijmnI3liqHlj6rlupTlvZPpgJrov4dyZWdpc3RlclNlcnZpY2XmnaXov5vooYzms6jlhowpXG4gICAgICogXG4gICAgICoga2V55piv5pyN5Yqh5ZCN56ewXG4gICAgICovXG4gICAgcmVhZG9ubHkgc2VydmljZXMgPSBuZXcgTWFwPHN0cmluZywgUmVnaXN0ZXJlZFNlcnZpY2U+KClcblxuICAgIGNvbnN0cnVjdG9yKGNvbmZpZzogU2VydmljZXNNYW5hZ2VyQ29uZmlnID0ge30pIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICBpZiAoU2VydmljZXNNYW5hZ2VyLl9zZXJ2aWNlc01hbmFnZXJDcmVhdGVkKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5uYW1lfeW3sue7j+iiq+WIm+W7uuS6hmApO1xuICAgICAgICBTZXJ2aWNlc01hbmFnZXIuX3NlcnZpY2VzTWFuYWdlckNyZWF0ZWQgPSB0cnVlO1xuXG4gICAgICAgIHByb2Nlc3Mub24oJ3VuaGFuZGxlZFJlamVjdGlvbicsIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICBsb2cuZSgn56iL5bqP5Ye6546w5pyq5o2V5o2JUHJvbWlzZeW8guW4uO+8micsIGVycik7XG5cbiAgICAgICAgICAgIGlmIChjb25maWcuc3RvcE9uSGF2ZVVuaGFuZGxlZFJlamVjdGlvbiAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAvL+ehruS/neS4jeS8mumHjeWkjeWFs+mXrVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBpbmcgJiYgdGhpcy5fc3RhdHVzICE9PSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcHJvY2Vzcy5vbigndW5jYXVnaHRFeGNlcHRpb24nLCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgbG9nLmUoJ+eoi+W6j+WHuueOsOacquaNleaNieW8guW4uO+8micsIGVycik7XG5cbiAgICAgICAgICAgIGlmIChjb25maWcuc3RvcE9uSGF2ZVVuY2F1Z2h0RXhjZXB0aW9uICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIC8v56Gu5L+d5LiN5Lya6YeN5aSN5YWz6ZetXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5zdG9wcGluZyAmJiB0aGlzLl9zdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZClcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdG9wKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBwcm9jZXNzLm9uKCdTSUdURVJNJywgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlU0lHVEVSTSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAvL+ehruS/neS4jeS8mumHjeWkjeWFs+mXrVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBpbmcgJiYgdGhpcy5fc3RhdHVzICE9PSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBwcm9jZXNzLm9uKCdTSUdJTlQnLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLnN0b3BPbkhhdmVTSUdJTlQgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgLy/noa7kv53kuI3kvJrph43lpI3lhbPpl61cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3RhdHVzICE9PSBSdW5uaW5nU3RhdHVzLnN0b3BwaW5nICYmIHRoaXMuX3N0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5zdG9wcGVkKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy/phY3nva7lgaXlurfmo4Dmn6XmnI3liqFcbiAgICAgICAgaWYgKGNvbmZpZy5zdGFydEhlYWx0aENoZWNraW5nICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgLy/opoHooqvnm5HlkKznmoTnq6/lj6NcbiAgICAgICAgICAgIGNvbnN0IHBvcnQgPSBcIi90bXAvc2VydmljZV9zdGFydGVyX2hlYWx0aF9jaGVja2luZy5zb2NrXCI7XG5cbiAgICAgICAgICAgIC8v5Yig6Zmk5LmL5YmN55qE5o6l5Y+j77yM6YG/5YWN6KKr5Y2g55SoXG4gICAgICAgICAgICBmcy5yZW1vdmVTeW5jKHBvcnQpO1xuXG4gICAgICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcihhc3luYyAocmVxLCByZXMpID0+IHtcblxuICAgICAgICAgICAgICAgIC8v5pyN5Yqh6L+Y5pyq5aSE5LqOcnVubmluZ+aXtuebtOaOpei/lOWbnuaIkOWKn1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMucnVubmluZykgcmV0dXJuIHJlcy5lbmQoJzAnKTtcblxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQ6IFtFcnJvciwgUmVnaXN0ZXJlZFNlcnZpY2VdIHwgdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgLy/mo4Dmn6Xmr4/kuIDkuKrmnI3liqHnmoTlgaXlurfnirblhrVcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRoaXMuc2VydmljZXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYXdhaXQgaXRlbS5faGVhbHRoQ2hlY2soKTtcblxuICAgICAgICAgICAgICAgICAgICAvL+S4jeS4uuepuuWwseihqOekuuaciemXrumimOS6hlxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtlcnIsIGl0ZW1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLmVuZCgnMCcpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoYFske3Jlc3VsdFsxXS5zZXJ2aWNlLm5hbWV9XSAgJHtyZXN1bHRbMF19YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkubGlzdGVuKHBvcnQsIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBsb2cuZSgnU2VydmljZXNNYW5hZ2Vy77ya5YGl5bq35qOA5p+lc2VydmVy5ZCv5Yqo5aSx6LSl77yaJywgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5ZCv5Yqo5omA5pyJ5rOo5YaM55qE5pyN5Yqh44CC5oyJ54Wn5rOo5YaM55qE5YWI5ZCO6aG65bqP5p2l5ZCv5Yqo5pyN5Yqh44CC5YWI5rOo5YaM55qE5pyN5Yqh5YWI5ZCv5Yqo44CCICAgICBcbiAgICAgKiDlpoLmnpzlkK/liqjov4fnqIvkuK3mn5DkuKrmnI3liqHlh7rnjrDlvILluLjvvIzliJnlkI7pnaLnmoTmnI3liqHliJnkuI3lho3ooqvlkK/liqjvvIzkuYvliY3lkK/liqjov4fkuobnmoTmnI3liqHkuZ/kvJrooqvkvp3mrKHlhbPpl63vvIjmjInnhafku47lkI7lkJHliY3nmoTpobrluo/vvInjgIIgICAgIFxuICAgICAqIOWQr+WKqOe7k+adn+WQjuS8muinpuWPkXN0YXJ0ZWTkuovku7ZcbiAgICAgKi9cbiAgICBzdGFydCA9ICgpID0+IHNldEltbWVkaWF0ZSh0aGlzLl9zdGFydC5iaW5kKHRoaXMpKTsgLy/kuLvopoHmmK/kuLrkuobnrYnlvoXmnoTpgKDlh73mlbDkuK3nmoTkuovku7bnu5HlrprlrozmiJBcbiAgICBwcml2YXRlIGFzeW5jIF9zdGFydCgpIHtcbiAgICAgICAgLy/noa7kv53lj6rmnInlnKhzdG9wcGVk55qE5oOF5Ya15LiL5omN6IO95omn6KGMc3RhcnRcbiAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5zdG9wcGVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFvmnI3liqHnrqHnkIblmajvvJoke3RoaXMubmFtZX1dIOWcqOi/mOacquWujOWFqOWFs+mXreeahOaDheWGteS4i+WPiOWGjeasoeiiq+WQr+WKqOOAguW9k+WJjeeahOeKtuaAgeS4uu+8miR7UnVubmluZ1N0YXR1c1t0aGlzLl9zdGF0dXNdfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgbG9nLmwodGhpcy5uYW1lLCAn5byA5aeL5ZCv5Yqo5pyN5YqhJyk7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMuc3RhcnRpbmc7XG5cbiAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLnNlcnZpY2VzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBjb25zdCBmYWlsZWQgPSBhd2FpdCBpdGVtLl9zdGFydCgpO1xuXG4gICAgICAgICAgICAvL+S4jeS4uuepuuWImeihqOekuuWQr+WKqOWksei0pVxuICAgICAgICAgICAgaWYgKGZhaWxlZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKDEpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxvZy5sKCfmiYDmnInmnI3liqHlt7LlkK/liqgnKTtcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gUnVubmluZ1N0YXR1cy5ydW5uaW5nO1xuICAgICAgICB0aGlzLmVtaXQoJ3N0YXJ0ZWQnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlhbPpl63miYDmnInlt7LlkK/liqjnmoTmnI3liqHjgILlhYjms6jlhoznmoTmnI3liqHmnIDlkI7ooqvlhbPpl63jgILlvZPmiYDmnInmnI3liqHpg73ooqvlhbPpl63lkI7lsIbkvJrpgIDlh7rnqIvluo/jgIJcbiAgICAgKiDlvZPmiYDmnInmnI3liqHpg73lgZzmraLlkI7lh7rlj5FzdG9wcGVk5LqL5Lu2XG4gICAgICogXG4gICAgICogQHBhcmFtIGV4aXRDb2RlIOeoi+W6j+mAgOWHuueKtuaAgeeggeOAgiAx5piv57O757uf6ZSZ6K+vXG4gICAgICovXG4gICAgc3RvcCA9IChleGl0Q29kZSA9IDApID0+IHNldEltbWVkaWF0ZSh0aGlzLl9zdG9wLmJpbmQodGhpcyksIGV4aXRDb2RlKTtcbiAgICBwcml2YXRlIGFzeW5jIF9zdG9wKGV4aXRDb2RlOiBudW1iZXIpIHtcbiAgICAgICAgLy/noa7kv53kuI3kvJrph43lpI3lgZzmraJcbiAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyA9PT0gUnVubmluZ1N0YXR1cy5zdG9wcGluZyB8fCB0aGlzLl9zdGF0dXMgPT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBb5pyN5Yqh566h55CG5Zmo77yaJHt0aGlzLm5hbWV9XSDlnKjlpITkuo7mraPlnKjlgZzmraLmiJblt7LlgZzmraLnmoTnirbmgIHkuIvlj4jlho3mrKHooqvlgZzmraLjgILlvZPliY3nmoTnirbmgIHkuLrvvJoke1J1bm5pbmdTdGF0dXNbdGhpcy5fc3RhdHVzXX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxvZy5sKHRoaXMubmFtZSwgJ+W8gOWni+WBnOatouacjeWKoScpO1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0b3BwaW5nO1xuXG4gICAgICAgIGZvciAobGV0IGl0ZW0gb2YgQXJyYXkuZnJvbSh0aGlzLnNlcnZpY2VzLnZhbHVlcygpKS5yZXZlcnNlKCkpIHtcbiAgICAgICAgICAgIGlmIChpdGVtLnN0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5zdG9wcGluZyAmJiBpdGVtLnN0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5zdG9wcGVkKVxuICAgICAgICAgICAgICAgIGF3YWl0IGl0ZW0uX3N0b3AoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxvZy5sKCfmiYDmnInmnI3liqHlt7LlgZzmraInKTtcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gUnVubmluZ1N0YXR1cy5zdG9wcGVkO1xuICAgICAgICB0aGlzLmVtaXQoJ3N0b3BwZWQnKTtcblxuICAgICAgICAvL+mAgOWHuuacjeWKoVxuICAgICAgICBwcm9jZXNzLmV4aXQoZXhpdENvZGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOazqOWGjOacjeWKoVxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U2VydmljZU1vZHVsZX0gc2VydmljZU1vZHVsZSDmnI3liqHmqKHlnZflrp7kvotcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyXG4gICAgICovXG4gICAgcmVnaXN0ZXJTZXJ2aWNlKHNlcnZpY2VNb2R1bGU6IFNlcnZpY2VNb2R1bGUpIHtcbiAgICAgICAgaWYgKHRoaXMuc2VydmljZXMuaGFzKHNlcnZpY2VNb2R1bGUubmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5pyN5YqhJyR7c2VydmljZU1vZHVsZS5uYW1lfSflt7Lms6jlhozov4fkuoZgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2VydmljZXMuc2V0KHNlcnZpY2VNb2R1bGUubmFtZSwgbmV3IFJlZ2lzdGVyZWRTZXJ2aWNlKHNlcnZpY2VNb2R1bGUsIHRoaXMpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOacjeWKoei/kOihjOi/h+eoi+S4reeahOmUmeivr+WkhOeQhuaWueazleOAguacjeWKoeWQr+WKqOaIluWFs+mXrei/h+eoi+S4reS6p+eUn+eahOmUmeivr+S4jeS8muinpuWPkeivpeaWueazleOAglxuICAgICAqIOazqOaEj++8mm9uRXJyb3LkuK3nmoTku6PnoIHkuI3lupTlh7rnjrDplJnor6/vvIzlpoLmnpxvbkVycm9y55qE5Lit55qE5Luj56CB5Ye6546w6ZSZ6K+v5bCG55u05o6l5a+86Ie056iL5bqP5YWz6Zet44CCXG4gICAgICogXG4gICAgICogQHBhcmFtIHtFcnJvcn0gZXJyIFxuICAgICAqIEBwYXJhbSB7U2VydmljZU1vZHVsZX0gc2VydmljZSDlj5HnlJ/plJnor6/nmoTmnI3liqHlrp7kvotcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyXG4gICAgICovXG4gICAgb25FcnJvcihlcnI6IEVycm9yLCBzZXJ2aWNlOiBTZXJ2aWNlTW9kdWxlKSB7XG4gICAgICAgIGxvZy5lKHNlcnZpY2UubmFtZSwgJ+WPkeeUn+mUmeivr++8micsIGVycik7XG4gICAgfVxufSJdfQ==
