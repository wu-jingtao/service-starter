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
            throw new Error(`[${this.name}] 在还未完全关闭的情况下又再次被启动。当前的状态为：${RunningStatus_1.RunningStatus[this._status]}`);
        log_formatter_1.default.location.bold.bgMagenta.title.bold.blue(this.name, '开始启动');
        this._status = RunningStatus_1.RunningStatus.starting;
        setTimeout(async () => {
            for (let item of this.services.values()) {
                //如果启动过程中出现了异常则就不再向下启动了（因为出现了异常之后_status或变为stopping）
                if (this._status !== RunningStatus_1.RunningStatus.starting)
                    return;
                //不为空则表示启动失败
                if (await item.start() !== undefined) {
                    return this.stop(2);
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
            this.emit('stopped');
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
            .location.white.bold
            .title.red
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9CYXNlU2VydmljZXNNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsMkRBQXdEO0FBQ3hELG1EQUFnRDtBQUNoRCxpREFBZ0M7QUFDaEMsNkNBQTZDO0FBRTdDOzs7Ozs7R0FNRztBQUNILHlCQUFpQyxTQUFRLE9BQU87SUEyQjVDO1FBQ0ksS0FBSyxFQUFFLENBQUM7UUF2Qlo7Ozs7V0FJRztRQUNNLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQztRQVFqRCxZQUFPLEdBQWtCLDZCQUFhLENBQUMsT0FBTyxDQUFDO1FBWW5ELEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLHVCQUF1QixDQUFDO1lBQzVDLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQyxDQUFDO1FBRXJFLG1CQUFtQixDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQztJQUN2RCxDQUFDO0lBdEJEOztPQUVHO0lBQ0gsSUFBSSxNQUFNO1FBQ04sTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDeEIsQ0FBQztJQUdEOztPQUVHO0lBQ0gsSUFBSSxJQUFJO1FBQ0osTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO0lBQ2pDLENBQUM7SUFXRDs7OztPQUlHO0lBQ0gsS0FBSztRQUNELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEtBQUssNkJBQWEsQ0FBQyxPQUFPLENBQUM7WUFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLDhCQUE4Qiw2QkFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFOUYsdUJBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQy9ELElBQUksQ0FBQyxPQUFPLEdBQUcsNkJBQWEsQ0FBQyxRQUFRLENBQUM7UUFFdEMsVUFBVSxDQUFDLEtBQUs7WUFDWixHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDdEMsb0RBQW9EO2dCQUNwRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxLQUFLLDZCQUFhLENBQUMsUUFBUSxDQUFDO29CQUFDLE1BQU0sQ0FBQztnQkFFcEQsWUFBWTtnQkFDWixFQUFFLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNuQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEIsQ0FBQztZQUNMLENBQUM7WUFFRCx1QkFBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLE9BQU8sR0FBRyw2QkFBYSxDQUFDLE9BQU8sQ0FBQztZQUNyQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNWLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQztRQUNiLFVBQVU7UUFDVixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxLQUFLLDZCQUFhLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssNkJBQWEsQ0FBQyxPQUFPLENBQUM7WUFDbEYsTUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLGtDQUFrQyw2QkFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFbEcsdUJBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQy9ELElBQUksQ0FBQyxPQUFPLEdBQUcsNkJBQWEsQ0FBQyxRQUFRLENBQUM7UUFFdEMsVUFBVSxDQUFDLEtBQUs7WUFDWixHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEtBQUssNkJBQWEsQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEtBQUssNkJBQWEsQ0FBQyxPQUFPLENBQUM7b0JBQzlHLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzFCLENBQUM7WUFFRCx1QkFBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLE9BQU8sR0FBRyw2QkFBYSxDQUFDLE9BQU8sQ0FBQztZQUNyQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNWLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFdBQVc7UUFDYixNQUFNLE1BQU0sR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLDZCQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFFNUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sS0FBSyw2QkFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDekMsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUVyQyxZQUFZO2dCQUNaLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNwQixNQUFNLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztvQkFDeEIsTUFBTSxDQUFDLFdBQVcsR0FBRyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxPQUFPLFlBQVksR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNuRixLQUFLLENBQUM7Z0JBQ1YsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO1FBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxPQUFPLENBQUMsT0FBMkIsRUFBRSxHQUFVLEVBQUUsT0FBMEI7UUFDdkUsdUJBQUcsQ0FBQyxLQUFLO2FBQ0osUUFBUSxDQUFDLEtBQUs7YUFDZCxLQUFLLENBQUMsR0FBRzthQUNULElBQUksQ0FBQyxHQUFHO2FBQ1IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsb0JBQW9CLENBQUMsR0FBVTtRQUMzQix1QkFBRyxDQUFDLEtBQUs7YUFDSixRQUFRLENBQUMsS0FBSyxDQUFDLElBQUk7YUFDbkIsS0FBSyxDQUFDLEdBQUc7YUFDVCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILGVBQWUsQ0FBQyxhQUFnQztRQUM1QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRCxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sYUFBYSxDQUFDLElBQUksUUFBUSxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxxQ0FBaUIsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNsRyxDQUFDO0lBQ0wsQ0FBQztJQVVELEVBQUUsQ0FBQyxLQUFhLEVBQUUsUUFBa0I7UUFDaEMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBS0QsSUFBSSxDQUFDLEtBQWEsRUFBRSxRQUFrQjtRQUNsQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM1QixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7O0FBbkxELG9EQUFvRDtBQUNyQywyQ0FBdUIsR0FBRyxLQUFLLENBQUM7QUFIbkQsa0RBc0xDIiwiZmlsZSI6ImNvbW1vbi9CYXNlU2VydmljZXNNYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmFzZVNlcnZpY2VNb2R1bGUgfSBmcm9tICcuL0Jhc2VTZXJ2aWNlTW9kdWxlJztcclxuaW1wb3J0IHsgUmVnaXN0ZXJlZFNlcnZpY2UgfSBmcm9tICcuL1JlZ2lzdGVyZWRTZXJ2aWNlJztcclxuaW1wb3J0IHsgUnVubmluZ1N0YXR1cyB9IGZyb20gXCIuL1J1bm5pbmdTdGF0dXNcIjtcclxuaW1wb3J0IGxvZyBmcm9tICdsb2ctZm9ybWF0dGVyJztcclxuaW1wb3J0ICogYXMgRW1pdHRlciBmcm9tICdjb21wb25lbnQtZW1pdHRlcic7XHJcblxyXG4vKipcclxuICog5pyN5Yqh566h55CG5Zmo44CC566h55CG5omA5pyJ5pyN5Yqh55qE5ZCv5Yqo44CB5YGc5q2i44CB5re75Yqg44CB5byC5bi45aSE55CGXHJcbiAqIFxyXG4gKiBAZXhwb3J0XHJcbiAqIEBjbGFzcyBCYXNlU2VydmljZXNNYW5hZ2VyXHJcbiAqIEBleHRlbmRzIHtFbWl0dGVyfVxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEJhc2VTZXJ2aWNlc01hbmFnZXIgZXh0ZW5kcyBFbWl0dGVyIHtcclxuXHJcbiAgICAvL1NlcnZpY2VzTWFuYWdlcuaYr+WQpuW3sue7j+WIm+W7uuS6hu+8iOS4gOS4qui/m+eoi+WPquWFgeiuuOWIm+W7uuS4gOS4qlNlcnZpY2VzTWFuYWdlcu+8iVxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX3NlcnZpY2VzTWFuYWdlckNyZWF0ZWQgPSBmYWxzZTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOazqOWGjOeahOacjeWKoeWIl+ihqOOAgijmnI3liqHlj6rlupTlvZPpgJrov4dyZWdpc3RlclNlcnZpY2XmnaXov5vooYzms6jlhowpXHJcbiAgICAgKiBcclxuICAgICAqIGtleeaYr+acjeWKoeWQjeensFxyXG4gICAgICovXHJcbiAgICByZWFkb25seSBzZXJ2aWNlcyA9IG5ldyBNYXA8c3RyaW5nLCBSZWdpc3RlcmVkU2VydmljZT4oKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOi/kOihjOeKtuaAgVxyXG4gICAgICovXHJcbiAgICBnZXQgc3RhdHVzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXM7XHJcbiAgICB9XHJcbiAgICBwcml2YXRlIF9zdGF0dXM6IFJ1bm5pbmdTdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCYXNlU2VydmljZXNNYW5hZ2VyIOeahOWQjeensO+8jOm7mOiupOaYr+exu+WQjeOAglxyXG4gICAgICovXHJcbiAgICBnZXQgbmFtZSgpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKEJhc2VTZXJ2aWNlc01hbmFnZXIuX3NlcnZpY2VzTWFuYWdlckNyZWF0ZWQpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5LiA5Liq6L+b56iL5Y+q5YWB6K645Yib5bu65LiA5LiqU2VydmljZXNNYW5hZ2Vy44CCJHt0aGlzLm5hbWV95bey57uP6KKr5Yib5bu65LqGYCk7XHJcblxyXG4gICAgICAgIEJhc2VTZXJ2aWNlc01hbmFnZXIuX3NlcnZpY2VzTWFuYWdlckNyZWF0ZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5ZCv5Yqo5omA5pyJ5rOo5YaM55qE5pyN5Yqh44CC5oyJ54Wn5rOo5YaM55qE5YWI5ZCO6aG65bqP5p2l5ZCv5Yqo5pyN5Yqh44CC5YWI5rOo5YaM55qE5pyN5Yqh5YWI5ZCv5Yqo44CCICAgICBcclxuICAgICAqIOWmguaenOWQr+WKqOi/h+eoi+S4reafkOS4quacjeWKoeWHuueOsOW8guW4uO+8jOWImeWQjumdoueahOacjeWKoeWwhuS4jeWGjeiiq+WQr+WKqO+8jOS5i+WJjeWQr+WKqOi/h+S6hueahOacjeWKoeS5n+S8muiiq+S+neasoeWFs+mXre+8iOaMieeFp+S7juWQjuWQkeWJjeeahOmhuuW6j+WFs+mXre+8ieOAgiAgICAgXHJcbiAgICAgKiDlkK/liqjnu5PmnZ/lkI7kvJrop6blj5FzdGFydGVk5LqL5Lu2XHJcbiAgICAgKi9cclxuICAgIHN0YXJ0KCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9zdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZCkgIC8v56Gu5L+d5Y+q5pyJ5Zyoc3RvcHBlZOeahOaDheWGteS4i+aJjeiDveaJp+ihjHN0YXJ0XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgWyR7dGhpcy5uYW1lfV0g5Zyo6L+Y5pyq5a6M5YWo5YWz6Zet55qE5oOF5Ya15LiL5Y+I5YaN5qyh6KKr5ZCv5Yqo44CC5b2T5YmN55qE54q25oCB5Li677yaJHtSdW5uaW5nU3RhdHVzW3RoaXMuX3N0YXR1c119YCk7XHJcblxyXG4gICAgICAgIGxvZy5sb2NhdGlvbi5ib2xkLmJnTWFnZW50YS50aXRsZS5ib2xkLmJsdWUodGhpcy5uYW1lLCAn5byA5aeL5ZCv5YqoJyk7XHJcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gUnVubmluZ1N0YXR1cy5zdGFydGluZztcclxuXHJcbiAgICAgICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7IC8v5Li76KaB5piv5Li65LqG562J5b6F5p6E6YCg5Ye95pWw5Lit55qE5LqL5Lu257uR5a6a5a6M5oiQXHJcbiAgICAgICAgICAgIGZvciAobGV0IGl0ZW0gb2YgdGhpcy5zZXJ2aWNlcy52YWx1ZXMoKSkge1xyXG4gICAgICAgICAgICAgICAgLy/lpoLmnpzlkK/liqjov4fnqIvkuK3lh7rnjrDkuoblvILluLjliJnlsLHkuI3lho3lkJHkuIvlkK/liqjkuobvvIjlm6DkuLrlh7rnjrDkuoblvILluLjkuYvlkI5fc3RhdHVz5oiW5Y+Y5Li6c3RvcHBpbmfvvIlcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RhcnRpbmcpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICAvL+S4jeS4uuepuuWImeihqOekuuWQr+WKqOWksei0pVxyXG4gICAgICAgICAgICAgICAgaWYgKGF3YWl0IGl0ZW0uc3RhcnQoKSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RvcCgyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbG9nLmxvY2F0aW9uLmJvbGQuYmdNYWdlbnRhLnRpdGxlLmJvbGQuZ3JlZW4odGhpcy5uYW1lLCAn5ZCv5Yqo5oiQ5YqfJyk7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMucnVubmluZztcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdzdGFydGVkJyk7XHJcbiAgICAgICAgfSwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlhbPpl63miYDmnInlt7LlkK/liqjnmoTmnI3liqHjgILlhYjms6jlhoznmoTmnI3liqHmnIDlkI7ooqvlhbPpl63jgIJcclxuICAgICAqIOW9k+aJgOacieacjeWKoemDveWBnOatouWQjuWHuuWPkXN0b3BwZWTkuovku7ZcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIGV4aXRDb2RlIOeoi+W6j+mAgOWHuueKtuaAgeeggeOAgjDmraPluLjpgIDlh7ogMeaYr+ezu+e7n+mUmeivryAgMueUqOaIt+acjeWKoemUmeivr1xyXG4gICAgICovXHJcbiAgICBzdG9wKGV4aXRDb2RlID0gMCkge1xyXG4gICAgICAgIC8v56Gu5L+d5LiN5Lya6YeN5aSN5YGc5q2iXHJcbiAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyA9PT0gUnVubmluZ1N0YXR1cy5zdG9wcGluZyB8fCB0aGlzLl9zdGF0dXMgPT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZClcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBbJHt0aGlzLm5hbWV9XSDlnKjlpITkuo7mraPlnKjlgZzmraLmiJblt7LlgZzmraLnmoTnirbmgIHkuIvlj4jlho3mrKHooqvlgZzmraLjgILlvZPliY3nmoTnirbmgIHkuLrvvJoke1J1bm5pbmdTdGF0dXNbdGhpcy5fc3RhdHVzXX1gKTtcclxuXHJcbiAgICAgICAgbG9nLmxvY2F0aW9uLmJvbGQuYmdNYWdlbnRhLnRpdGxlLmJvbGQuYmx1ZSh0aGlzLm5hbWUsICflvIDlp4vlgZzmraInKTtcclxuICAgICAgICB0aGlzLl9zdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0b3BwaW5nO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiBbLi4udGhpcy5zZXJ2aWNlcy52YWx1ZXMoKV0ucmV2ZXJzZSgpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5zZXJ2aWNlLnJ1bm5pbmdTdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBpbmcgJiYgaXRlbS5zZXJ2aWNlLnJ1bm5pbmdTdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZClcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBpdGVtLnN0b3AoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbG9nLmxvY2F0aW9uLmJvbGQuYmdNYWdlbnRhLnRpdGxlLmJvbGQuZ3JlZW4odGhpcy5uYW1lLCAn5YGc5q2i5oiQ5YqfJyk7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZDtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdzdG9wcGVkJyk7XHJcbiAgICAgICAgfSwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDov5vooYzlgaXlurfmo4Dmn6XjgIJcclxuICAgICAqIOazqOaEj++8muWmguaenOeoi+W6j+eahOi/kOihjOeKtuaAgeS4unN0YXJ0aW5n77yMc3RvcHBpbmfvvIxzdG9wcGVk77yM5YiZ55u05o6l5bCG56iL5bqP55qE6L+Q6KGM6KeG5Li65YGl5bq344CC5Y+q5pyJ5b2T6L+Q6KGM54q25oCB5Li6cnVubmluZ+aXtuaJjei/m+ihjOWBpeW6t+ajgOafpeOAgiAgICAgXHJcbiAgICAgKiDov5Tlm54gaXNIZWFsdGgg6KGo56S65piv5ZCm5YGl5bq3IGRlc2NyaXB0aW9u5a+55b2T5YmN54q25oCB55qE6aKd5aSW5o+P6L+wXHJcbiAgICAgKiBcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHsgaXNIZWFsdGg6IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfT59IFxyXG4gICAgICogQG1lbWJlcm9mIEJhc2VTZXJ2aWNlc01hbmFnZXJcclxuICAgICAqL1xyXG4gICAgYXN5bmMgaGVhbHRoQ2hlY2soKTogUHJvbWlzZTx7IGlzSGVhbHRoOiBib29sZWFuLCBkZXNjcmlwdGlvbjogc3RyaW5nIH0+IHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSB7IGlzSGVhbHRoOiB0cnVlLCBkZXNjcmlwdGlvbjogUnVubmluZ1N0YXR1c1t0aGlzLl9zdGF0dXNdIH07XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9zdGF0dXMgPT09IFJ1bm5pbmdTdGF0dXMucnVubmluZykge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRoaXMuc2VydmljZXMudmFsdWVzKCkpIHsgLy/mo4Dmn6Xmr4/kuIDkuKrmnI3liqHnmoTlgaXlurfnirblhrVcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGF3YWl0IGl0ZW0uaGVhbHRoQ2hlY2soKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL+S4jeS4uuepuuWwseihqOekuuaciemXrumimOS6hlxyXG4gICAgICAgICAgICAgICAgaWYgKGVyciAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmlzSGVhbHRoID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmRlc2NyaXB0aW9uID0gYFske2l0ZW0uc2VydmljZS5uYW1lfV0gICR7ZXJyLm1lc3NhZ2V9IC0+IFxcclxcbiAke2Vyci5zdGFja31gO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5pyN5Yqh6L+Q6KGM6L+H56iL5Lit55qE6ZSZ6K+v5aSE55CG5pa55rOV44CC5pyN5Yqh5ZCv5Yqo5oiW5YWz6Zet6L+H56iL5Lit5Lqn55Sf55qE6ZSZ6K+v5LiN5Lya6Kem5Y+R6K+l5pa55rOV44CCICAgIFxyXG4gICAgICog6KaG5YaZ5pe25Yir5b+Y5LqG6LCD55Soc3VwZXIub25FcnJvcigpXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgdW5kZWZpbmVkfSBlcnJOYW1lIOmUmeivr+a2iOaBr+eahOWQjeensFxyXG4gICAgICogQHBhcmFtIHtFcnJvcn0gZXJyIOmUmeivr+WvueixoVxyXG4gICAgICogQHBhcmFtIHtTZXJ2aWNlTW9kdWxlfSBzZXJ2aWNlIOWPkeeUn+mUmeivr+eahOacjeWKoeWunuS+i1xyXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlclxyXG4gICAgICovXHJcbiAgICBvbkVycm9yKGVyck5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZCwgZXJyOiBFcnJvciwgc2VydmljZTogQmFzZVNlcnZpY2VNb2R1bGUpIHtcclxuICAgICAgICBsb2cuZXJyb3JcclxuICAgICAgICAgICAgLmxvY2F0aW9uLndoaXRlXHJcbiAgICAgICAgICAgIC50aXRsZS5yZWRcclxuICAgICAgICAgICAgLnRleHQucmVkXHJcbiAgICAgICAgICAgIC5jb250ZW50LnJlZChzZXJ2aWNlLm5hbWUsICflj5HnlJ/plJnor6/vvJonLCBlcnJOYW1lLCBlcnIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5b2T5Ye6546w5pyq5o2V6I635byC5bi45pe26Kem5Y+R77yI5YyF5ous5Li65aSE55CGcHJvbWlzZSByZWplY3Rpb27vvIkgICAgXHJcbiAgICAgKiDopoblhpnml7bliKvlv5jkuobosIPnlKhzdXBlci5vblVuSGFuZGxlZEV4Y2VwdGlvbigpXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7RXJyb3J9IGVyciDplJnor6/lr7nosaFcclxuICAgICAqL1xyXG4gICAgb25VbkhhbmRsZWRFeGNlcHRpb24oZXJyOiBFcnJvcikge1xyXG4gICAgICAgIGxvZy5lcnJvclxyXG4gICAgICAgICAgICAubG9jYXRpb24ud2hpdGUuYm9sZFxyXG4gICAgICAgICAgICAudGl0bGUucmVkXHJcbiAgICAgICAgICAgIC5jb250ZW50LnJlZCh0aGlzLm5hbWUsICflh7rnjrDmnKrmjZXmjYnlvILluLjvvJonLCBlcnIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5rOo5YaM5pyN5Yqh44CC5rOo5YaM5pyN5Yqh55qE5ZCN56ew5piv5Lul57G75ZCN5Li65YeGXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7U2VydmljZU1vZHVsZX0gc2VydmljZU1vZHVsZSDmnI3liqHmqKHlnZflrp7kvotcclxuICAgICAqIEBtZW1iZXJvZiBTZXJ2aWNlc01hbmFnZXJcclxuICAgICAqL1xyXG4gICAgcmVnaXN0ZXJTZXJ2aWNlKHNlcnZpY2VNb2R1bGU6IEJhc2VTZXJ2aWNlTW9kdWxlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc2VydmljZXMuaGFzKHNlcnZpY2VNb2R1bGUuY29uc3RydWN0b3IubmFtZSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDmnI3liqHvvJonJHtzZXJ2aWNlTW9kdWxlLm5hbWV9J+W3suazqOWGjOi/h+S6hmApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VydmljZXMuc2V0KHNlcnZpY2VNb2R1bGUuY29uc3RydWN0b3IubmFtZSwgbmV3IFJlZ2lzdGVyZWRTZXJ2aWNlKHNlcnZpY2VNb2R1bGUsIHRoaXMpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDnqIvluo/lt7LlkK/liqhcclxuICAgICAqL1xyXG4gICAgb24oZXZlbnQ6ICdzdGFydGVkJywgbGlzdGVuZXI6ICgpID0+IGFueSk6IHRoaXM7XHJcbiAgICAvKipcclxuICAgICAqIOeoi+W6j+W3suWFs+mXrVxyXG4gICAgICovXHJcbiAgICBvbihldmVudDogJ3N0b3BwZWQnLCBsaXN0ZW5lcjogKCkgPT4gYW55KTogdGhpcztcclxuICAgIG9uKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHRoaXMge1xyXG4gICAgICAgIHN1cGVyLm9uKGV2ZW50LCBsaXN0ZW5lcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIG9uY2UoZXZlbnQ6ICdzdGFydGVkJywgbGlzdGVuZXI6ICgpID0+IGFueSk6IHRoaXM7XHJcbiAgICBvbmNlKGV2ZW50OiAnc3RvcHBlZCcsIGxpc3RlbmVyOiAoKSA9PiBhbnkpOiB0aGlzO1xyXG4gICAgb25jZShldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogRnVuY3Rpb24pOiB0aGlzIHtcclxuICAgICAgICBzdXBlci5vbmNlKGV2ZW50LCBsaXN0ZW5lcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn0iXX0=
