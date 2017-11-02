"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RegisteredService_1 = require("./RegisteredService");
const RunningStatus_1 = require("./RunningStatus");
const log_formatter_1 = require("log-formatter");
const Emitter = require("component-emitter");
/**
 * 服务管理器。管理所有服务的启动、停止、添加、异常处理
 *
 * @export
 * @class BaseServicesManager
 * @extends {Emitter}
 */
class BaseServicesManager extends Emitter {
    constructor() {
        super();
        /**
         * 注册的服务列表。(服务只应当通过registerService来进行注册)
         *
         * key是服务名称
         */
        this.services = new Map();
        this._status = RunningStatus_1.RunningStatus.stopped;
        if (BaseServicesManager._servicesManagerCreated)
            throw new Error(`一个进程只允许创建一个ServicesManager。`);
        BaseServicesManager._servicesManagerCreated = true;
    }
    /**
     * 运行状态
     */
    get status() {
        return this._status;
    }
    /**
     * BaseServicesManager 的名称，默认是类名。
     */
    get name() {
        return this.constructor.name;
    }
    /**
     * 启动所有注册的服务。按照注册的先后顺序来启动服务。先注册的服务先启动。
     * 如果启动过程中某个服务出现异常，则后面的服务将不再被启动，之前启动过了的服务也会被依次关闭（按照从后向前的顺序关闭）。
     * 启动结束后会触发started事件
     */
    start() {
        if (this._status !== RunningStatus_1.RunningStatus.stopped)
            throw new Error(`[${this.name}] 在未完全关闭的情况下又再次被启动。当前的状态为：${RunningStatus_1.RunningStatus[this._status]}`);
        log_formatter_1.default.location.bold.bgMagenta.title.bold.blue(this.name, '开始启动');
        this._status = RunningStatus_1.RunningStatus.starting;
        setTimeout(async () => {
            for (let item of this.services.values()) {
                //如果启动过程中出现了异常则就不再向下启动了（因为出现了异常之后_status或变为stopping）
                if (this._status !== RunningStatus_1.RunningStatus.starting)
                    return;
                //不为空则表示启动失败
                if (await item.start() !== undefined) {
                    if (this.status !== RunningStatus_1.RunningStatus.stopping && this.status !== RunningStatus_1.RunningStatus.stopped) {
                        this.stop(2);
                    }
                    return;
                }
            }
            log_formatter_1.default.location.bold.bgMagenta.title.bold.green(this.name, '启动成功');
            this._status = RunningStatus_1.RunningStatus.running;
            this.emit('started');
        }, 0);
    }
    /**
     * 关闭所有已启动的服务。先注册的服务最后被关闭。
     * 当所有服务都停止后出发stopped事件
     *
     * @param exitCode 程序退出状态码。0正常退出 1是系统错误  2用户服务错误
     */
    stop(exitCode = 0) {
        //确保不会重复停止
        if (this._status === RunningStatus_1.RunningStatus.stopping || this._status === RunningStatus_1.RunningStatus.stopped)
            throw new Error(`[${this.name}] 在处于正在停止或已停止的状态下又再次被停止。当前的状态为：${RunningStatus_1.RunningStatus[this._status]}`);
        log_formatter_1.default.location.bold.bgMagenta.title.bold.blue(this.name, '开始停止');
        this._status = RunningStatus_1.RunningStatus.stopping;
        setTimeout(async () => {
            for (let item of [...this.services.values()].reverse()) {
                if (item.service.runningStatus !== RunningStatus_1.RunningStatus.stopping && item.service.runningStatus !== RunningStatus_1.RunningStatus.stopped)
                    await item.stop();
            }
            log_formatter_1.default.location.bold.bgMagenta.title.bold.green(this.name, '停止成功');
            this._status = RunningStatus_1.RunningStatus.stopped;
            this.emit('stopped', exitCode);
        }, 0);
    }
    /**
     * 进行健康检查。
     * 注意：如果程序的运行状态为starting，stopping，stopped，则直接将程序的运行视为健康。只有当运行状态为running时才进行健康检查。
     * 返回 isHealth 表示是否健康 description对当前状态的额外描述
     *
     * @returns {Promise<{ isHealth: boolean, description: string }>}
     * @memberof BaseServicesManager
     */
    async healthCheck() {
        const result = { isHealth: true, description: RunningStatus_1.RunningStatus[this._status] };
        if (this._status === RunningStatus_1.RunningStatus.running) {
            for (let item of this.services.values()) {
                const err = await item.healthCheck();
                //不为空就表示有问题了
                if (err !== undefined) {
                    result.isHealth = false;
                    result.description = `[${item.service.name}]  ${err.message} -> \r\n ${err.stack}`;
                    break;
                }
            }
        }
        return result;
    }
    /**
     * 服务运行过程中的错误处理方法。服务启动或关闭过程中产生的错误不会触发该方法。
     * 覆写时别忘了调用super.onError()
     *
     * @param {string | undefined} errName 错误消息的名称
     * @param {Error} err 错误对象
     * @param {ServiceModule} service 发生错误的服务实例
     * @memberof ServicesManager
     */
    onError(errName, err, service) {
        log_formatter_1.default.error
            .location.white
            .title.red
            .text.red
            .content.red(service.name, '发生错误：', errName, err);
    }
    /**
     * 当出现未捕获异常时触发（包括为处理promise rejection）
     * 覆写时别忘了调用super.onUnHandledException()
     *
     * @param {Error} err 错误对象
     */
    onUnHandledException(err) {
        log_formatter_1.default.error
            .location.bold.bgMagenta.white
            .title.bold.red
            .content.red(this.name, '出现未捕捉异常：', err);
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
    on(event, listener) {
        super.on(event, listener);
        return this;
    }
    once(event, listener) {
        super.once(event, listener);
        return this;
    }
}
//ServicesManager是否已经创建了（一个进程只允许创建一个ServicesManager）
BaseServicesManager._servicesManagerCreated = false;
exports.BaseServicesManager = BaseServicesManager;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9CYXNlU2VydmljZXNNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsMkRBQXdEO0FBQ3hELG1EQUFnRDtBQUNoRCxpREFBZ0M7QUFDaEMsNkNBQTZDO0FBRTdDOzs7Ozs7R0FNRztBQUNILHlCQUFpQyxTQUFRLE9BQU87SUEyQjVDO1FBQ0ksS0FBSyxFQUFFLENBQUM7UUF2Qlo7Ozs7V0FJRztRQUNNLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQztRQVFqRCxZQUFPLEdBQWtCLDZCQUFhLENBQUMsT0FBTyxDQUFDO1FBWW5ELEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLHVCQUF1QixDQUFDO1lBQzVDLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztRQUVuRCxtQkFBbUIsQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUM7SUFDdkQsQ0FBQztJQXRCRDs7T0FFRztJQUNILElBQUksTUFBTTtRQUNOLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3hCLENBQUM7SUFHRDs7T0FFRztJQUNILElBQUksSUFBSTtRQUNKLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztJQUNqQyxDQUFDO0lBV0Q7Ozs7T0FJRztJQUNILEtBQUs7UUFDRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxLQUFLLDZCQUFhLENBQUMsT0FBTyxDQUFDO1lBQ3ZDLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSw2QkFBNkIsNkJBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRTdGLHVCQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMvRCxJQUFJLENBQUMsT0FBTyxHQUFH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YUFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILGVBQWUsQ0FBQyxhQUFnQztRQUM1QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRCxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sYUFBYSxDQUFDLElBQUksUUFBUSxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxxQ0FBaUIsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNsRyxDQUFDO0lBQ0wsQ0FBQztJQVdELEVBQUUsQ0FBQyxLQUFhLEVBQUUsUUFBa0I7UUFDaEMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBSUQsSUFBSSxDQUFDLEtBQWEsRUFBRSxRQUFrQjtRQUNsQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM1QixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7O0FBdExELG9EQUFvRDtBQUNyQywyQ0FBdUIsR0FBRyxLQUFLLENBQUM7QUFIbkQsa0RBeUxDIiwiZmlsZSI6ImNvbW1vbi9CYXNlU2VydmljZXNNYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmFzZVNlcnZpY2VNb2R1bGUgfSBmcm9tICcuL0Jhc2VTZXJ2aWNlTW9kdWxlJztcclxuaW1wb3J0IHsgUmVnaXN0ZXJlZFNlcnZpY2UgfSBmcm9tICcuL1JlZ2lzdGVyZWRTZXJ2aWNlJztcclxuaW1wb3J0IHsgUnVubmluZ1N0YXR1cyB9IGZyb20gXCIuL1J1bm5pbmdTdGF0dXNcIjtcclxuaW1wb3J0IGxvZyBmcm9tICdsb2ctZm9ybWF0dGVyJztcclxuaW1wb3J0ICogYXMgRW1pdHRlciBmcm9tICdjb21wb25lbnQtZW1pdHRlcic7XHJcblxyXG4vKipcclxuICog5pyN5Yqh566h55CG5Zmo44CC566h55CG5omA5pyJ5pyN5Yqh55qE5ZCv5Yqo44CB5YGc5q2i44CB5re75Yqg44CB5byC5bi45aSE55CGXHJcbiAqIFxyXG4gKiBAZXhwb3J0XHJcbiAqIEBjbGFzcyBCYXNlU2VydmljZXNNYW5hZ2VyXHJcbiAqIEBleHRlbmRzIHtFbWl0dGVyfVxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEJhc2VTZXJ2aWNlc01hbmFnZXIgZXh0ZW5kcyBFbWl0dGVyIHtcclxuXHJcbiAgICAvL1NlcnZpY2VzTWFuYWdlcuaYr+WQpuW3sue7j+WIm+W7uuS6hu+8iOS4gOS4qui/m+eoi+WPquWFgeiuuOWIm+W7uuS4gOS4qlNlcnZpY2VzTWFuYWdlcu+8iVxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX3NlcnZpY2VzTWFuYWdlckNyZWF0ZWQgPSBmYWxzZTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOazqOWGjOeahOacjeWKoeWIl+ihqOOAgijmnI3liqHlj6rlupTlvZPpgJrov4dyZWdpc3RlclNlcnZpY2XmnaXov5vooYzms6jlhowpXHJcbiAgICAgKiBcclxuICAgICAqIGtleeaYr+acjeWKoeWQjeensFxyXG4gICAgICovXHJcbiAgICByZWFkb25seSBzZXJ2aWNlcyA9IG5ldyBNYXA8c3RyaW5nLCBSZWdpc3RlcmVkU2VydmljZT4oKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOi/kOihjOeKtuaAgVxyXG4gICAgICovXHJcbiAgICBnZXQgc3RhdHVzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXM7XHJcbiAgICB9XHJcbiAgICBwcml2YXRlIF9zdGF0dXM6IFJ1bm5pbmdTdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCYXNlU2VydmljZXNNYW5hZ2VyIOeahOWQjeensO+8jOm7mOiupOaYr+exu+WQjeOAglxyXG4gICAgICovXHJcbiAgICBnZXQgbmFtZSgpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKEJhc2VTZXJ2aWNlc01hbmFnZXIuX3NlcnZpY2VzTWFuYWdlckNyZWF0ZWQpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5LiA5Liq6L+b56iL5Y+q5YWB6K645Yib5bu65LiA5LiqU2VydmljZXNNYW5hZ2Vy44CCYCk7XHJcblxyXG4gICAgICAgIEJhc2VTZXJ2aWNlc01hbmFnZXIuX3NlcnZpY2VzTWFuYWdlckNyZWF0ZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5ZCv5Yqo5omA5pyJ5rOo5YaM55qE5pyN5Yqh44CC5oyJ54Wn5rOo5YaM55qE5YWI5ZCO6aG65bqP5p2l5ZCv5Yqo5pyN5Yqh44CC5YWI5rOo5YaM55qE5pyN5Yqh5YWI5ZCv5Yqo44CCICAgICBcclxuICAgICAqIOWmguaenOWQr+WKqOi/h+eoi+S4reafkOS4quacjeWKoeWHuueOsOW8guW4uO+8jOWImeWQjumdoueahOacjeWKoeWwhuS4jeWGjeiiq+WQr+WKqO+8jOS5i+WJjeWQr+WKqOi/h+S6hueahOacjeWKoeS5n+S8muiiq+S+neasoeWFs+mXre+8iOaMieeFp+S7juWQjuWQkeWJjeeahOmhuuW6j+WFs+mXre+8ieOAgiAgICAgXHJcbiAgICAgKiDlkK/liqjnu5PmnZ/lkI7kvJrop6blj5FzdGFydGVk5LqL5Lu2XHJcbiAgICAgKi9cclxuICAgIHN0YXJ0KCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9zdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZCkgIC8v56Gu5L+d5Y+q5pyJ5Zyoc3RvcHBlZOeahOaDheWGteS4i+aJjeiDveaJp+ihjHN0YXJ0XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgWyR7dGhpcy5uYW1lfV0g5Zyo5pyq5a6M5YWo5YWz6Zet55qE5oOF5Ya15LiL5Y+I5YaN5qyh6KKr5ZCv5Yqo44CC5b2T5YmN55qE54q25oCB5Li677yaJHtSdW5uaW5nU3RhdHVzW3RoaXMuX3N0YXR1c119YCk7XHJcblxyXG4gICAgICAgIGxvZy5sb2NhdGlvbi5ib2xkLmJnTWFnZW50YS50aXRsZS5ib2xkLmJsdWUodGhpcy5uYW1lLCAn5byA5aeL5ZCv5YqoJyk7XHJcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gUnVubmluZ1N0YXR1cy5zdGFydGluZztcclxuXHJcbiAgICAgICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7IC8v5Li76KaB5piv5Li65LqG562J5b6FZG9ja2Vy5p6E6YCg5Ye95pWw5Lit55qE5LqL5Lu257uR5a6a5a6M5oiQXHJcbiAgICAgICAgICAgIGZvciAobGV0IGl0ZW0gb2YgdGhpcy5zZXJ2aWNlcy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICAgICAgLy/lpoLmnpzlkK/liqjov4fnqIvkuK3lh7rnjrDkuoblvILluLjliJnlsLHkuI3lho3lkJHkuIvlkK/liqjkuobvvIjlm6DkuLrlh7rnjrDkuoblvILluLjkuYvlkI5fc3RhdHVz5oiW5Y+Y5Li6c3RvcHBpbmfvvIlcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RhcnRpbmcpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICAvL+S4jeS4uuepuuWImeihqOekuuWQr+WKqOWksei0pVxyXG4gICAgICAgICAgICAgICAgaWYgKGF3YWl0IGl0ZW0uc3RhcnQoKSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdHVzICE9PSBSdW5uaW5nU3RhdHVzLnN0b3BwaW5nICYmIHRoaXMuc3RhdHVzICE9PSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdG9wKDIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxvZy5sb2NhdGlvbi5ib2xkLmJnTWFnZW50YS50aXRsZS5ib2xkLmdyZWVuKHRoaXMubmFtZSwgJ+WQr+WKqOaIkOWKnycpO1xyXG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnJ1bm5pbmc7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnc3RhcnRlZCcpO1xyXG4gICAgICAgIH0sIDApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5YWz6Zet5omA5pyJ5bey5ZCv5Yqo55qE5pyN5Yqh44CC5YWI5rOo5YaM55qE5pyN5Yqh5pyA5ZCO6KKr5YWz6Zet44CCXHJcbiAgICAgKiDlvZPmiYDmnInmnI3liqHpg73lgZzmraLlkI7lh7rlj5FzdG9wcGVk5LqL5Lu2XHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSBleGl0Q29kZSDnqIvluo/pgIDlh7rnirbmgIHnoIHjgIIw5q2j5bi46YCA5Ye6IDHmmK/ns7vnu5/plJnor68gIDLnlKjmiLfmnI3liqHplJnor69cclxuICAgICAqL1xyXG4gICAgc3RvcChleGl0Q29kZSA9IDApIHtcclxuICAgICAgICAvL+ehruS/neS4jeS8mumHjeWkjeWBnOatolxyXG4gICAgICAgIGlmICh0aGlzLl9zdGF0dXMgPT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBpbmcgfHwgdGhpcy5fc3RhdHVzID09PSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgWyR7dGhpcy5uYW1lfV0g5Zyo5aSE5LqO5q2j5Zyo5YGc5q2i5oiW5bey5YGc5q2i55qE54q25oCB5LiL5Y+I5YaN5qyh6KKr5YGc5q2i44CC5b2T5YmN55qE54q25oCB5Li677yaJHtSdW5uaW5nU3RhdHVzW3RoaXMuX3N0YXR1c119YCk7XHJcblxyXG4gICAgICAgIGxvZy5sb2NhdGlvbi5ib2xkLmJnTWFnZW50YS50aXRsZS5ib2xkLmJsdWUodGhpcy5uYW1lLCAn5byA5aeL5YGc5q2iJyk7XHJcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gUnVubmluZ1N0YXR1cy5zdG9wcGluZztcclxuXHJcbiAgICAgICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGl0ZW0gb2YgWy4uLnRoaXMuc2VydmljZXMudmFsdWVzKCldLnJldmVyc2UoKSkgeyAvL+S7juWQjuWQkeWJjeWBnOatolxyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0uc2VydmljZS5ydW5uaW5nU3RhdHVzICE9PSBSdW5uaW5nU3RhdHVzLnN0b3BwaW5nICYmIGl0ZW0uc2VydmljZS5ydW5uaW5nU3RhdHVzICE9PSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgaXRlbS5zdG9wKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxvZy5sb2NhdGlvbi5ib2xkLmJnTWFnZW50YS50aXRsZS5ib2xkLmdyZWVuKHRoaXMubmFtZSwgJ+WBnOatouaIkOWKnycpO1xyXG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQ7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnc3RvcHBlZCcsIGV4aXRDb2RlKTtcclxuICAgICAgICB9LCAwKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOi/m+ihjOWBpeW6t+ajgOafpeOAglxyXG4gICAgICog5rOo5oSP77ya5aaC5p6c56iL5bqP55qE6L+Q6KGM54q25oCB5Li6c3RhcnRpbmfvvIxzdG9wcGluZ++8jHN0b3BwZWTvvIzliJnnm7TmjqXlsIbnqIvluo/nmoTov5DooYzop4bkuLrlgaXlurfjgILlj6rmnInlvZPov5DooYznirbmgIHkuLpydW5uaW5n5pe25omN6L+b6KGM5YGl5bq35qOA5p+l44CCICAgICBcclxuICAgICAqIOi/lOWbniBpc0hlYWx0aCDooajnpLrmmK/lkKblgaXlurcgZGVzY3JpcHRpb27lr7nlvZPliY3nirbmgIHnmoTpop3lpJbmj4/ov7BcclxuICAgICAqIFxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8eyBpc0hlYWx0aDogYm9vbGVhbiwgZGVzY3JpcHRpb246IHN0cmluZyB9Pn0gXHJcbiAgICAgKiBAbWVtYmVyb2YgQmFzZVNlcnZpY2VzTWFuYWdlclxyXG4gICAgICovXHJcbiAgICBhc3luYyBoZWFsdGhDaGVjaygpOiBQcm9taXNlPHsgaXNIZWFsdGg6IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfT4ge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgaXNIZWFsdGg6IHRydWUsIGRlc2NyaXB0aW9uOiBSdW5uaW5nU3RhdHVzW3RoaXMuX3N0YXR1c10gfTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyA9PT0gUnVubmluZ1N0YXR1cy5ydW5uaW5nKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGl0ZW0gb2YgdGhpcy5zZXJ2aWNlcy52YWx1ZXMoKSkgeyAvL+ajgOafpeavj+S4gOS4quacjeWKoeeahOWBpeW6t+eKtuWGtVxyXG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYXdhaXQgaXRlbS5oZWFsdGhDaGVjaygpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8v5LiN5Li656m65bCx6KGo56S65pyJ6Zeu6aKY5LqGXHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQuaXNIZWFsdGggPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQuZGVzY3JpcHRpb24gPSBgWyR7aXRlbS5zZXJ2aWNlLm5hbWV9XSAgJHtlcnIubWVzc2FnZX0gLT4gXFxyXFxuICR7ZXJyLnN0YWNrfWA7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmnI3liqHov5DooYzov4fnqIvkuK3nmoTplJnor6/lpITnkIbmlrnms5XjgILmnI3liqHlkK/liqjmiJblhbPpl63ov4fnqIvkuK3kuqfnlJ/nmoTplJnor6/kuI3kvJrop6blj5Hor6Xmlrnms5XjgIIgICAgXHJcbiAgICAgKiDopoblhpnml7bliKvlv5jkuobosIPnlKhzdXBlci5vbkVycm9yKClcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IGVyck5hbWUg6ZSZ6K+v5raI5oGv55qE5ZCN56ewXHJcbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBlcnIg6ZSZ6K+v5a+56LGhXHJcbiAgICAgKiBAcGFyYW0ge1NlcnZpY2VNb2R1bGV9IHNlcnZpY2Ug5Y+R55Sf6ZSZ6K+v55qE5pyN5Yqh5a6e5L6LXHJcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIG9uRXJyb3IoZXJyTmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBlcnI6IEVycm9yLCBzZXJ2aWNlOiBCYXNlU2VydmljZU1vZHVsZSkge1xyXG4gICAgICAgIGxvZy5lcnJvclxyXG4gICAgICAgICAgICAubG9jYXRpb24ud2hpdGVcclxuICAgICAgICAgICAgLnRpdGxlLnJlZFxyXG4gICAgICAgICAgICAudGV4dC5yZWRcclxuICAgICAgICAgICAgLmNvbnRlbnQucmVkKHNlcnZpY2UubmFtZSwgJ+WPkeeUn+mUmeivr++8micsIGVyck5hbWUsIGVycik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlvZPlh7rnjrDmnKrmjZXojrflvILluLjml7bop6blj5HvvIjljIXmi6zkuLrlpITnkIZwcm9taXNlIHJlamVjdGlvbu+8iSAgICBcclxuICAgICAqIOimhuWGmeaXtuWIq+W/mOS6huiwg+eUqHN1cGVyLm9uVW5IYW5kbGVkRXhjZXB0aW9uKClcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtFcnJvcn0gZXJyIOmUmeivr+WvueixoVxyXG4gICAgICovXHJcbiAgICBvblVuSGFuZGxlZEV4Y2VwdGlvbihlcnI6IEVycm9yKSB7XHJcbiAgICAgICAgbG9nLmVycm9yXHJcbiAgICAgICAgICAgIC5sb2NhdGlvbi5ib2xkLmJnTWFnZW50YS53aGl0ZVxyXG4gICAgICAgICAgICAudGl0bGUuYm9sZC5yZWRcclxuICAgICAgICAgICAgLmNvbnRlbnQucmVkKHRoaXMubmFtZSwgJ+WHuueOsOacquaNleaNieW8guW4uO+8micsIGVycik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDms6jlhozmnI3liqHjgILms6jlhozmnI3liqHnmoTlkI3np7DmmK/ku6XnsbvlkI3kuLrlh4ZcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtTZXJ2aWNlTW9kdWxlfSBzZXJ2aWNlTW9kdWxlIOacjeWKoeaooeWdl+WunuS+i1xyXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlclxyXG4gICAgICovXHJcbiAgICByZWdpc3RlclNlcnZpY2Uoc2VydmljZU1vZHVsZTogQmFzZVNlcnZpY2VNb2R1bGUpIHtcclxuICAgICAgICBpZiAodGhpcy5zZXJ2aWNlcy5oYXMoc2VydmljZU1vZHVsZS5jb25zdHJ1Y3Rvci5uYW1lKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOacjeWKoe+8micke3NlcnZpY2VNb2R1bGUubmFtZX0n5bey5rOo5YaM6L+H5LqGYCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zZXJ2aWNlcy5zZXQoc2VydmljZU1vZHVsZS5jb25zdHJ1Y3Rvci5uYW1lLCBuZXcgUmVnaXN0ZXJlZFNlcnZpY2Uoc2VydmljZU1vZHVsZSwgdGhpcykpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOeoi+W6j+W3suWQr+WKqFxyXG4gICAgICovXHJcbiAgICBvbihldmVudDogJ3N0YXJ0ZWQnLCBsaXN0ZW5lcjogKCkgPT4gYW55KTogdGhpcztcclxuICAgIC8qKlxyXG4gICAgICog56iL5bqP5bey5YWz6Zet44CCICAgXHJcbiAgICAgKiBjb2RlIOmAgOWHuueKtuaAgeeggVxyXG4gICAgICovXHJcbiAgICBvbihldmVudDogJ3N0b3BwZWQnLCBsaXN0ZW5lcjogKGNvZGU6IG51bWJlcikgPT4gYW55KTogdGhpcztcclxuICAgIG9uKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHRoaXMge1xyXG4gICAgICAgIHN1cGVyLm9uKGV2ZW50LCBsaXN0ZW5lcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgb25jZShldmVudDogJ3N0YXJ0ZWQnLCBsaXN0ZW5lcjogKCkgPT4gYW55KTogdGhpcztcclxuICAgIG9uY2UoZXZlbnQ6ICdzdG9wcGVkJywgbGlzdGVuZXI6IChjb2RlOiBudW1iZXIpID0+IGFueSk6IHRoaXM7XHJcbiAgICBvbmNlKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHRoaXMge1xyXG4gICAgICAgIHN1cGVyLm9uY2UoZXZlbnQsIGxpc3RlbmVyKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufSJdfQ==
