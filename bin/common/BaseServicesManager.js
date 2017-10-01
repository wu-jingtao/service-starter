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
            throw new Error(`一个进程只允许创建一个ServicesManager。${this.name}已经被创建了`);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9CYXNlU2VydmljZXNNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsMkRBQXdEO0FBQ3hELG1EQUFnRDtBQUNoRCxpREFBZ0M7QUFDaEMsNkNBQTZDO0FBRTdDOzs7Ozs7R0FNRztBQUNILHlCQUFpQyxTQUFRLE9BQU87SUEyQjVDO1FBQ0ksS0FBSyxFQUFFLENBQUM7UUF2Qlo7Ozs7V0FJRztRQUNNLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQztRQVFqRCxZQUFPLEdBQWtCLDZCQUFhLENBQUMsT0FBTyxDQUFDO1FBWW5ELEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLHVCQUF1QixDQUFDO1lBQzVDLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQyxDQUFDO1FBRXJFLG1CQUFtQixDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQztJQUN2RCxDQUFDO0lBdEJEOztPQUVHO0lBQ0gsSUFBSSxNQUFNO1FBQ04sTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDeEIsQ0FBQztJQUdEOztPQUVHO0lBQ0gsSUFBSSxJQUFJO1FBQ0osTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO0lBQ2pDLENBQUM7SUFXRDs7OztPQUlHO0lBQ0gsS0FBSztRQUNELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEtBQUssNkJBQWEsQ0FBQyxPQUFPLENBQUM7WUFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLDZCQUE2Qiw2QkFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFN0YsdUJBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQy9E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Q0FBQyxJQUFJLENBQUMsR0FBRzthQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsZUFBZSxDQUFDLGFBQWdDO1FBQzVDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxhQUFhLENBQUMsSUFBSSxRQUFRLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLHFDQUFpQixDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2xHLENBQUM7SUFDTCxDQUFDO0lBV0QsRUFBRSxDQUFDLEtBQWEsRUFBRSxRQUFrQjtRQUNoQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFLRCxJQUFJLENBQUMsS0FBYSxFQUFFLFFBQWtCO1FBQ2xDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQzs7QUF2TEQsb0RBQW9EO0FBQ3JDLDJDQUF1QixHQUFHLEtBQUssQ0FBQztBQUhuRCxrREEwTEMiLCJmaWxlIjoiY29tbW9uL0Jhc2VTZXJ2aWNlc01hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlU2VydmljZU1vZHVsZSB9IGZyb20gJy4vQmFzZVNlcnZpY2VNb2R1bGUnO1xyXG5pbXBvcnQgeyBSZWdpc3RlcmVkU2VydmljZSB9IGZyb20gJy4vUmVnaXN0ZXJlZFNlcnZpY2UnO1xyXG5pbXBvcnQgeyBSdW5uaW5nU3RhdHVzIH0gZnJvbSBcIi4vUnVubmluZ1N0YXR1c1wiO1xyXG5pbXBvcnQgbG9nIGZyb20gJ2xvZy1mb3JtYXR0ZXInO1xyXG5pbXBvcnQgKiBhcyBFbWl0dGVyIGZyb20gJ2NvbXBvbmVudC1lbWl0dGVyJztcclxuXHJcbi8qKlxyXG4gKiDmnI3liqHnrqHnkIblmajjgILnrqHnkIbmiYDmnInmnI3liqHnmoTlkK/liqjjgIHlgZzmraLjgIHmt7vliqDjgIHlvILluLjlpITnkIZcclxuICogXHJcbiAqIEBleHBvcnRcclxuICogQGNsYXNzIEJhc2VTZXJ2aWNlc01hbmFnZXJcclxuICogQGV4dGVuZHMge0VtaXR0ZXJ9XHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQmFzZVNlcnZpY2VzTWFuYWdlciBleHRlbmRzIEVtaXR0ZXIge1xyXG5cclxuICAgIC8vU2VydmljZXNNYW5hZ2Vy5piv5ZCm5bey57uP5Yib5bu65LqG77yI5LiA5Liq6L+b56iL5Y+q5YWB6K645Yib5bu65LiA5LiqU2VydmljZXNNYW5hZ2Vy77yJXHJcbiAgICBwcml2YXRlIHN0YXRpYyBfc2VydmljZXNNYW5hZ2VyQ3JlYXRlZCA9IGZhbHNlO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog5rOo5YaM55qE5pyN5Yqh5YiX6KGo44CCKOacjeWKoeWPquW6lOW9k+mAmui/h3JlZ2lzdGVyU2VydmljZeadpei/m+ihjOazqOWGjClcclxuICAgICAqIFxyXG4gICAgICoga2V55piv5pyN5Yqh5ZCN56ewXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IHNlcnZpY2VzID0gbmV3IE1hcDxzdHJpbmcsIFJlZ2lzdGVyZWRTZXJ2aWNlPigpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog6L+Q6KGM54q25oCBXHJcbiAgICAgKi9cclxuICAgIGdldCBzdGF0dXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1cztcclxuICAgIH1cclxuICAgIHByaXZhdGUgX3N0YXR1czogUnVubmluZ1N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEJhc2VTZXJ2aWNlc01hbmFnZXIg55qE5ZCN56ew77yM6buY6K6k5piv57G75ZCN44CCXHJcbiAgICAgKi9cclxuICAgIGdldCBuYW1lKCk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICBpZiAoQmFzZVNlcnZpY2VzTWFuYWdlci5fc2VydmljZXNNYW5hZ2VyQ3JlYXRlZClcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDkuIDkuKrov5vnqIvlj6rlhYHorrjliJvlu7rkuIDkuKpTZXJ2aWNlc01hbmFnZXLjgIIke3RoaXMubmFtZX3lt7Lnu4/ooqvliJvlu7rkuoZgKTtcclxuXHJcbiAgICAgICAgQmFzZVNlcnZpY2VzTWFuYWdlci5fc2VydmljZXNNYW5hZ2VyQ3JlYXRlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlkK/liqjmiYDmnInms6jlhoznmoTmnI3liqHjgILmjInnhafms6jlhoznmoTlhYjlkI7pobrluo/mnaXlkK/liqjmnI3liqHjgILlhYjms6jlhoznmoTmnI3liqHlhYjlkK/liqjjgIIgICAgIFxyXG4gICAgICog5aaC5p6c5ZCv5Yqo6L+H56iL5Lit5p+Q5Liq5pyN5Yqh5Ye6546w5byC5bi477yM5YiZ5ZCO6Z2i55qE5pyN5Yqh5bCG5LiN5YaN6KKr5ZCv5Yqo77yM5LmL5YmN5ZCv5Yqo6L+H5LqG55qE5pyN5Yqh5Lmf5Lya6KKr5L6d5qyh5YWz6Zet77yI5oyJ54Wn5LuO5ZCO5ZCR5YmN55qE6aG65bqP5YWz6Zet77yJ44CCICAgICBcclxuICAgICAqIOWQr+WKqOe7k+adn+WQjuS8muinpuWPkXN0YXJ0ZWTkuovku7ZcclxuICAgICAqL1xyXG4gICAgc3RhcnQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5zdG9wcGVkKSAgLy/noa7kv53lj6rmnInlnKhzdG9wcGVk55qE5oOF5Ya15LiL5omN6IO95omn6KGMc3RhcnRcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbJHt0aGlzLm5hbWV9XSDlnKjmnKrlrozlhajlhbPpl63nmoTmg4XlhrXkuIvlj4jlho3mrKHooqvlkK/liqjjgILlvZPliY3nmoTnirbmgIHkuLrvvJoke1J1bm5pbmdTdGF0dXNbdGhpcy5fc3RhdHVzXX1gKTtcclxuXHJcbiAgICAgICAgbG9nLmxvY2F0aW9uLmJvbGQuYmdNYWdlbnRhLnRpdGxlLmJvbGQuYmx1ZSh0aGlzLm5hbWUsICflvIDlp4vlkK/liqgnKTtcclxuICAgICAgICB0aGlzLl9zdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0YXJ0aW5nO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHsgLy/kuLvopoHmmK/kuLrkuobnrYnlvoXmnoTpgKDlh73mlbDkuK3nmoTkuovku7bnu5HlrprlrozmiJBcclxuICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLnNlcnZpY2VzLnZhbHVlcygpKSB7XHJcbiAgICAgICAgICAgICAgICAvL+WmguaenOWQr+WKqOi/h+eoi+S4reWHuueOsOS6huW8guW4uOWImeWwseS4jeWGjeWQkeS4i+WQr+WKqOS6hu+8iOWboOS4uuWHuueOsOS6huW8guW4uOS5i+WQjl9zdGF0dXPmiJblj5jkuLpzdG9wcGluZ++8iVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5zdGFydGluZykgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIC8v5LiN5Li656m65YiZ6KGo56S65ZCv5Yqo5aSx6LSlXHJcbiAgICAgICAgICAgICAgICBpZiAoYXdhaXQgaXRlbS5zdGFydCgpICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBpbmcgJiYgdGhpcy5zdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0b3AoMik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbG9nLmxvY2F0aW9uLmJvbGQuYmdNYWdlbnRhLnRpdGxlLmJvbGQuZ3JlZW4odGhpcy5uYW1lLCAn5ZCv5Yqo5oiQ5YqfJyk7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMucnVubmluZztcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdzdGFydGVkJyk7XHJcbiAgICAgICAgfSwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlhbPpl63miYDmnInlt7LlkK/liqjnmoTmnI3liqHjgILlhYjms6jlhoznmoTmnI3liqHmnIDlkI7ooqvlhbPpl63jgIJcclxuICAgICAqIOW9k+aJgOacieacjeWKoemDveWBnOatouWQjuWHuuWPkXN0b3BwZWTkuovku7ZcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIGV4aXRDb2RlIOeoi+W6j+mAgOWHuueKtuaAgeeggeOAgjDmraPluLjpgIDlh7ogMeaYr+ezu+e7n+mUmeivryAgMueUqOaIt+acjeWKoemUmeivr1xyXG4gICAgICovXHJcbiAgICBzdG9wKGV4aXRDb2RlID0gMCkge1xyXG4gICAgICAgIC8v56Gu5L+d5LiN5Lya6YeN5aSN5YGc5q2iXHJcbiAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyA9PT0gUnVubmluZ1N0YXR1cy5zdG9wcGluZyB8fCB0aGlzLl9zdGF0dXMgPT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZClcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbJHt0aGlzLm5hbWV9XSDlnKjlpITkuo7mraPlnKjlgZzmraLmiJblt7LlgZzmraLnmoTnirbmgIHkuIvlj4jlho3mrKHooqvlgZzmraLjgILlvZPliY3nmoTnirbmgIHkuLrvvJoke1J1bm5pbmdTdGF0dXNbdGhpcy5fc3RhdHVzXX1gKTtcclxuXHJcbiAgICAgICAgbG9nLmxvY2F0aW9uLmJvbGQuYmdNYWdlbnRhLnRpdGxlLmJvbGQuYmx1ZSh0aGlzLm5hbWUsICflvIDlp4vlgZzmraInKTtcclxuICAgICAgICB0aGlzLl9zdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0b3BwaW5nO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiBbLi4udGhpcy5zZXJ2aWNlcy52YWx1ZXMoKV0ucmV2ZXJzZSgpKSB7IC8v5LuO5ZCO5ZCR5YmN5YGc5q2iXHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5zZXJ2aWNlLnJ1bm5pbmdTdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBpbmcgJiYgaXRlbS5zZXJ2aWNlLnJ1bm5pbmdTdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZClcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBpdGVtLnN0b3AoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbG9nLmxvY2F0aW9uLmJvbGQuYmdNYWdlbnRhLnRpdGxlLmJvbGQuZ3JlZW4odGhpcy5uYW1lLCAn5YGc5q2i5oiQ5YqfJyk7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZDtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdzdG9wcGVkJywgZXhpdENvZGUpO1xyXG4gICAgICAgIH0sIDApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog6L+b6KGM5YGl5bq35qOA5p+l44CCXHJcbiAgICAgKiDms6jmhI/vvJrlpoLmnpznqIvluo/nmoTov5DooYznirbmgIHkuLpzdGFydGluZ++8jHN0b3BwaW5n77yMc3RvcHBlZO+8jOWImeebtOaOpeWwhueoi+W6j+eahOi/kOihjOinhuS4uuWBpeW6t+OAguWPquacieW9k+i/kOihjOeKtuaAgeS4unJ1bm5pbmfml7bmiY3ov5vooYzlgaXlurfmo4Dmn6XjgIIgICAgIFxyXG4gICAgICog6L+U5ZueIGlzSGVhbHRoIOihqOekuuaYr+WQpuWBpeW6tyBkZXNjcmlwdGlvbuWvueW9k+WJjeeKtuaAgeeahOmineWkluaPj+i/sFxyXG4gICAgICogXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx7IGlzSGVhbHRoOiBib29sZWFuLCBkZXNjcmlwdGlvbjogc3RyaW5nIH0+fSBcclxuICAgICAqIEBtZW1iZXJvZiBCYXNlU2VydmljZXNNYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGhlYWx0aENoZWNrKCk6IFByb21pc2U8eyBpc0hlYWx0aDogYm9vbGVhbiwgZGVzY3JpcHRpb246IHN0cmluZyB9PiB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0geyBpc0hlYWx0aDogdHJ1ZSwgZGVzY3JpcHRpb246IFJ1bm5pbmdTdGF0dXNbdGhpcy5fc3RhdHVzXSB9O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fc3RhdHVzID09PSBSdW5uaW5nU3RhdHVzLnJ1bm5pbmcpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLnNlcnZpY2VzLnZhbHVlcygpKSB7IC8v5qOA5p+l5q+P5LiA5Liq5pyN5Yqh55qE5YGl5bq354q25Ya1XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhd2FpdCBpdGVtLmhlYWx0aENoZWNrKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy/kuI3kuLrnqbrlsLHooajnpLrmnInpl67popjkuoZcclxuICAgICAgICAgICAgICAgIGlmIChlcnIgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5pc0hlYWx0aCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5kZXNjcmlwdGlvbiA9IGBbJHtpdGVtLnNlcnZpY2UubmFtZX1dICAke2Vyci5tZXNzYWdlfSAtPiBcXHJcXG4gJHtlcnIuc3RhY2t9YDtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOacjeWKoei/kOihjOi/h+eoi+S4reeahOmUmeivr+WkhOeQhuaWueazleOAguacjeWKoeWQr+WKqOaIluWFs+mXrei/h+eoi+S4reS6p+eUn+eahOmUmeivr+S4jeS8muinpuWPkeivpeaWueazleOAgiAgICBcclxuICAgICAqIOimhuWGmeaXtuWIq+W/mOS6huiwg+eUqHN1cGVyLm9uRXJyb3IoKVxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZH0gZXJyTmFtZSDplJnor6/mtojmga/nmoTlkI3np7BcclxuICAgICAqIEBwYXJhbSB7RXJyb3J9IGVyciDplJnor6/lr7nosaFcclxuICAgICAqIEBwYXJhbSB7U2VydmljZU1vZHVsZX0gc2VydmljZSDlj5HnlJ/plJnor6/nmoTmnI3liqHlrp7kvotcclxuICAgICAqIEBtZW1iZXJvZiBTZXJ2aWNlc01hbmFnZXJcclxuICAgICAqL1xyXG4gICAgb25FcnJvcihlcnJOYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQsIGVycjogRXJyb3IsIHNlcnZpY2U6IEJhc2VTZXJ2aWNlTW9kdWxlKSB7XHJcbiAgICAgICAgbG9nLmVycm9yXHJcbiAgICAgICAgICAgIC5sb2NhdGlvbi53aGl0ZVxyXG4gICAgICAgICAgICAudGl0bGUucmVkXHJcbiAgICAgICAgICAgIC50ZXh0LnJlZFxyXG4gICAgICAgICAgICAuY29udGVudC5yZWQoc2VydmljZS5uYW1lLCAn5Y+R55Sf6ZSZ6K+v77yaJywgZXJyTmFtZSwgZXJyKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOW9k+WHuueOsOacquaNleiOt+W8guW4uOaXtuinpuWPke+8iOWMheaLrOS4uuWkhOeQhnByb21pc2UgcmVqZWN0aW9u77yJICAgIFxyXG4gICAgICog6KaG5YaZ5pe25Yir5b+Y5LqG6LCD55Soc3VwZXIub25VbkhhbmRsZWRFeGNlcHRpb24oKVxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBlcnIg6ZSZ6K+v5a+56LGhXHJcbiAgICAgKi9cclxuICAgIG9uVW5IYW5kbGVkRXhjZXB0aW9uKGVycjogRXJyb3IpIHtcclxuICAgICAgICBsb2cuZXJyb3JcclxuICAgICAgICAgICAgLmxvY2F0aW9uLmJvbGQuYmdNYWdlbnRhLndoaXRlXHJcbiAgICAgICAgICAgIC50aXRsZS5ib2xkLnJlZFxyXG4gICAgICAgICAgICAuY29udGVudC5yZWQodGhpcy5uYW1lLCAn5Ye6546w5pyq5o2V5o2J5byC5bi477yaJywgZXJyKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOazqOWGjOacjeWKoeOAguazqOWGjOacjeWKoeeahOWQjeensOaYr+S7peexu+WQjeS4uuWHhlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge1NlcnZpY2VNb2R1bGV9IHNlcnZpY2VNb2R1bGUg5pyN5Yqh5qih5Z2X5a6e5L6LXHJcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHJlZ2lzdGVyU2VydmljZShzZXJ2aWNlTW9kdWxlOiBCYXNlU2VydmljZU1vZHVsZSkge1xyXG4gICAgICAgIGlmICh0aGlzLnNlcnZpY2VzLmhhcyhzZXJ2aWNlTW9kdWxlLmNvbnN0cnVjdG9yLm5hbWUpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5pyN5Yqh77yaJyR7c2VydmljZU1vZHVsZS5uYW1lfSflt7Lms6jlhozov4fkuoZgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnNlcnZpY2VzLnNldChzZXJ2aWNlTW9kdWxlLmNvbnN0cnVjdG9yLm5hbWUsIG5ldyBSZWdpc3RlcmVkU2VydmljZShzZXJ2aWNlTW9kdWxlLCB0aGlzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog56iL5bqP5bey5ZCv5YqoXHJcbiAgICAgKi9cclxuICAgIG9uKGV2ZW50OiAnc3RhcnRlZCcsIGxpc3RlbmVyOiAoKSA9PiBhbnkpOiB0aGlzO1xyXG4gICAgLyoqXHJcbiAgICAgKiDnqIvluo/lt7LlhbPpl63jgIIgICBcclxuICAgICAqIGNvZGUg6YCA5Ye654q25oCB56CBXHJcbiAgICAgKi9cclxuICAgIG9uKGV2ZW50OiAnc3RvcHBlZCcsIGxpc3RlbmVyOiAoY29kZTogbnVtYmVyKSA9PiBhbnkpOiB0aGlzO1xyXG4gICAgb24oZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6IEZ1bmN0aW9uKTogdGhpcyB7XHJcbiAgICAgICAgc3VwZXIub24oZXZlbnQsIGxpc3RlbmVyKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcblxyXG4gICAgb25jZShldmVudDogJ3N0YXJ0ZWQnLCBsaXN0ZW5lcjogKCkgPT4gYW55KTogdGhpcztcclxuICAgIG9uY2UoZXZlbnQ6ICdzdG9wcGVkJywgbGlzdGVuZXI6IChjb2RlOiBudW1iZXIpID0+IGFueSk6IHRoaXM7XHJcbiAgICBvbmNlKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHRoaXMge1xyXG4gICAgICAgIHN1cGVyLm9uY2UoZXZlbnQsIGxpc3RlbmVyKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufSJdfQ==
