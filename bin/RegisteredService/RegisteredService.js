"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RunningStatus_1 = require("../RunningStatus");
const Log_1 = require("../Log");
/**
 * 对注册了的服务进行一层封装，便于ServicesManager使用。
 * 对于注册服务的生命周期进行管理。
 *
 * @class RegisteredService
 */
class RegisteredService {
    constructor(service, manager) {
        /**
         * 绑定在服务上的错误监听器。
         *
         * @type {Function}
         */
        this._errorListener = async (err) => {
            const value = await this.service.onError(err);
            switch (value) {
                case false:
                    this._manager.onError(err, this.service);
                    break;
                case true:
                    break;
                default:
                    if (value instanceof Error)
                        this._manager.onError(value, this.service);
                    break;
            }
        };
        this._status = RunningStatus_1.RunningStatus.stopped;
        this.service = service;
        this._manager = manager;
        // 给服务绑定管理器
        this.service.servicesManager = manager;
    }
    /**
     * 服务的运行状态
     */
    get status() {
        return this._status;
    }
    /**
     * 启动服务。成功返回void，失败返回Error。
     * 如果抛出异常则一定是该程序内部逻辑错误
     * 这个方法仅供内部使用。
     *
     * @returns {Promise<Error | void>}
     */
    async _start() {
        //确保只有在stopped的情况下才能执行_start
        if (this._status !== RunningStatus_1.RunningStatus.stopped) {
            throw new Error(Log_1.log.s1.format(`服务：${this.service.name}`, '在还未完全关闭的情况下又再次被启动。', `当前的状态为：${RunningStatus_1.RunningStatus[this._status]}`));
        }
        try {
            Log_1.log.s1.l(Log_1.log.chalk.blue('服务：开始启动'), this.service.name);
            this._status = RunningStatus_1.RunningStatus.starting;
            await this.service.onStart();
            this.service.on('error', this._errorListener);
            Log_1.log.s1.l(Log_1.log.chalk.green('服务：成功启动'), this.service.name);
            this._status = RunningStatus_1.RunningStatus.running;
        }
        catch (err) {
            Log_1.log.s1.e(Log_1.log.chalk.red('服务：启动失败'), this.service.name, err);
            await this._stop();
            return err;
        }
    }
    /**
     * 停止服务。
     * 如果抛出异常则一定是该程序内部逻辑错误
     * 这个方法仅供内部使用。
     */
    async _stop() {
        //确保不会重复停止
        if (this._status === RunningStatus_1.RunningStatus.stopping || this._status === RunningStatus_1.RunningStatus.stopped) {
            throw new Error(Log_1.log.s1.format(`服务：${this.service.name}`, '在处于正在停止或已停止的状态下又再次被停止。', `当前的状态为：${RunningStatus_1.RunningStatus[this._status]}`));
        }
        try {
            Log_1.log.s1.l(Log_1.log.chalk.blue('服务：开始停止'), this.service.name);
            this._status = RunningStatus_1.RunningStatus.stopping;
            await this.service.onStop();
            Log_1.log.s1.l(Log_1.log.chalk.green('服务：成功停止'), this.service.name);
        }
        catch (err) {
            Log_1.log.s1.e(Log_1.log.chalk.red('服务：停止失败'), this.service.name, err);
        }
        finally {
            this._status = RunningStatus_1.RunningStatus.stopped;
            this.service.removeListener('error', this._errorListener);
        }
    }
    /**
     * 健康检查。
     * 如果抛出异常则一定是该程序内部逻辑错误
     * 这个方法仅供内部使用。
     *
     * @returns {(Promise<Error | void>)} 健康检查出现的错误
     */
    async _healthCheck() {
        // 确保只检查运行状况下的健康状态
        if (this._status !== RunningStatus_1.RunningStatus.running) {
            throw new Error(Log_1.log.s1.format(`服务：${this.service.name}`, '在非运行状态下进行了健康检查。', `当前的状态为：${RunningStatus_1.RunningStatus[this._status]}`));
        }
        try {
            await this.service.onHealthChecking();
        }
        catch (err) {
            Log_1.log.s1.w(`服务：${this.service.name}`, '运行状况异常：', err);
            return err;
        }
    }
}
exports.RegisteredService = RegisteredService;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlJlZ2lzdGVyZWRTZXJ2aWNlL1JlZ2lzdGVyZWRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsb0RBQWlEO0FBQ2pELGdDQUE2QjtBQUU3Qjs7Ozs7R0FLRztBQUNIO0lBMkNJLFlBQVksT0FBc0IsRUFBRSxPQUF3QjtRQXBDNUQ7Ozs7V0FJRztRQUNjLG1CQUFjLEdBQUcsS0FBSyxFQUFFLEdBQVU7WUFDL0MsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUU5QyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNaLEtBQUssS0FBSztvQkFDTixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUN6QyxLQUFLLENBQUM7Z0JBQ1YsS0FBSyxJQUFJO29CQUNMLEtBQUssQ0FBQztnQkFDVjtvQkFDSSxFQUFFLENBQUMsQ0FBQyxLQUFLLFlBQVksS0FBSyxDQUFDO3dCQUN2QixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUMvQyxLQUFLLENBQUM7WUFDZCxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBZU0sWUFBTyxHQUFrQiw2QkFBYSxDQUFDLE9BQU8sQ0FBQztRQUduRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUV4QixXQUFXO1FBQ1gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDO0lBQzNDLENBQUM7SUFkRDs7T0FFRztJQUNILElBQVcsTUFBTTtRQUNiLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3hCLENBQUM7SUFXRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsTUFB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SUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQy9ELENBQUM7Z0JBQVMsQ0FBQztZQUNQLElBQUksQ0FBQyxPQUFPLEdBQUcsNkJBQWEsQ0FBQyxPQUFPLENBQUM7WUFDckMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUM5RCxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxZQUFZO1FBQ2Qsa0JBQWtCO1FBQ2xCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEtBQUssNkJBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sSUFBSSxLQUFLLENBQ1gsU0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQ1QsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUN6QixpQkFBaUIsRUFDakIsVUFBVSw2QkFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUMxQyxDQUNKLENBQUM7UUFDTixDQUFDO1FBRUQsSUFBSSxDQUFDO1lBQ0QsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDMUMsQ0FBQztRQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDWCxTQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDZixDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBakpELDhDQWlKQyIsImZpbGUiOiJSZWdpc3RlcmVkU2VydmljZS9SZWdpc3RlcmVkU2VydmljZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNlcnZpY2VNb2R1bGUgfSBmcm9tIFwiLi4vU2VydmljZU1vZHVsZS9TZXJ2aWNlTW9kdWxlXCI7XG5pbXBvcnQgeyBTZXJ2aWNlc01hbmFnZXIgfSBmcm9tIFwiLi4vU2VydmljZXNNYW5hZ2VyL1NlcnZpY2VzTWFuYWdlclwiO1xuaW1wb3J0IHsgUnVubmluZ1N0YXR1cyB9IGZyb20gXCIuLi9SdW5uaW5nU3RhdHVzXCI7XG5pbXBvcnQgeyBsb2cgfSBmcm9tIFwiLi4vTG9nXCI7XG5cbi8qKlxuICog5a+55rOo5YaM5LqG55qE5pyN5Yqh6L+b6KGM5LiA5bGC5bCB6KOF77yM5L6/5LqOU2VydmljZXNNYW5hZ2Vy5L2/55So44CCXG4gKiDlr7nkuo7ms6jlhozmnI3liqHnmoTnlJ/lkb3lkajmnJ/ov5vooYznrqHnkIbjgIJcbiAqIFxuICogQGNsYXNzIFJlZ2lzdGVyZWRTZXJ2aWNlXG4gKi9cbmV4cG9ydCBjbGFzcyBSZWdpc3RlcmVkU2VydmljZSB7XG5cbiAgICAvKipcbiAgICAgKiDkv53lrZjlr7nmnI3liqHnrqHnkIblmajnmoTlvJXnlKhcbiAgICAgKi9cbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tYW5hZ2VyOiBTZXJ2aWNlc01hbmFnZXI7XG5cbiAgICAvKipcbiAgICAgKiDnu5HlrprlnKjmnI3liqHkuIrnmoTplJnor6/nm5HlkKzlmajjgIJcbiAgICAgKiBcbiAgICAgKiBAdHlwZSB7RnVuY3Rpb259XG4gICAgICovXG4gICAgcHJpdmF0ZSByZWFkb25seSBfZXJyb3JMaXN0ZW5lciA9IGFzeW5jIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgdGhpcy5zZXJ2aWNlLm9uRXJyb3IoZXJyKTtcblxuICAgICAgICBzd2l0Y2ggKHZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIGZhbHNlOlxuICAgICAgICAgICAgICAgIHRoaXMuX21hbmFnZXIub25FcnJvcihlcnIsIHRoaXMuc2VydmljZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIHRydWU6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEVycm9yKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYW5hZ2VyLm9uRXJyb3IodmFsdWUsIHRoaXMuc2VydmljZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICog5pyN5Yqh5a6e5L6LXG4gICAgICogXG4gICAgICogQHR5cGUge1NlcnZpY2VNb2R1bGV9XG4gICAgICovXG4gICAgcmVhZG9ubHkgc2VydmljZTogU2VydmljZU1vZHVsZTtcblxuICAgIC8qKlxuICAgICAqIOacjeWKoeeahOi/kOihjOeKtuaAgVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgc3RhdHVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzO1xuICAgIH1cbiAgICBwcml2YXRlIF9zdGF0dXM6IFJ1bm5pbmdTdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQ7XG5cbiAgICBjb25zdHJ1Y3RvcihzZXJ2aWNlOiBTZXJ2aWNlTW9kdWxlLCBtYW5hZ2VyOiBTZXJ2aWNlc01hbmFnZXIpIHtcbiAgICAgICAgdGhpcy5zZXJ2aWNlID0gc2VydmljZTtcbiAgICAgICAgdGhpcy5fbWFuYWdlciA9IG1hbmFnZXI7XG5cbiAgICAgICAgLy8g57uZ5pyN5Yqh57uR5a6a566h55CG5ZmoXG4gICAgICAgIHRoaXMuc2VydmljZS5zZXJ2aWNlc01hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWQr+WKqOacjeWKoeOAguaIkOWKn+i/lOWbnnZvaWTvvIzlpLHotKXov5Tlm55FcnJvcuOAgiAgICBcbiAgICAgKiDlpoLmnpzmipvlh7rlvILluLjliJnkuIDlrprmmK/or6XnqIvluo/lhoXpg6jpgLvovpHplJnor68gICAgICBcbiAgICAgKiDov5nkuKrmlrnms5Xku4XkvpvlhoXpg6jkvb/nlKjjgIJcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxFcnJvciB8IHZvaWQ+fSBcbiAgICAgKi9cbiAgICBhc3luYyBfc3RhcnQoKTogUHJvbWlzZTxFcnJvciB8IHZvaWQ+IHtcbiAgICAgICAgLy/noa7kv53lj6rmnInlnKhzdG9wcGVk55qE5oOF5Ya15LiL5omN6IO95omn6KGMX3N0YXJ0XG4gICAgICAgIGlmICh0aGlzLl9zdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgIGxvZy5zMS5mb3JtYXQoXG4gICAgICAgICAgICAgICAgICAgIGDmnI3liqHvvJoke3RoaXMuc2VydmljZS5uYW1lfWAsXG4gICAgICAgICAgICAgICAgICAgICflnKjov5jmnKrlrozlhajlhbPpl63nmoTmg4XlhrXkuIvlj4jlho3mrKHooqvlkK/liqjjgIInLFxuICAgICAgICAgICAgICAgICAgICBg5b2T5YmN55qE54q25oCB5Li677yaJHtSdW5uaW5nU3RhdHVzW3RoaXMuX3N0YXR1c119YFxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbG9nLnMxLmwobG9nLmNoYWxrLmJsdWUoJ+acjeWKoe+8muW8gOWni+WQr+WKqCcpLCB0aGlzLnNlcnZpY2UubmFtZSk7XG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0YXJ0aW5nO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNlcnZpY2Uub25TdGFydCgpO1xuICAgICAgICAgICAgdGhpcy5zZXJ2aWNlLm9uKCdlcnJvcicsIHRoaXMuX2Vycm9yTGlzdGVuZXIpO1xuXG4gICAgICAgICAgICBsb2cuczEubChsb2cuY2hhbGsuZ3JlZW4oJ+acjeWKoe+8muaIkOWKn+WQr+WKqCcpLCB0aGlzLnNlcnZpY2UubmFtZSk7XG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnJ1bm5pbmc7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgbG9nLnMxLmUobG9nLmNoYWxrLnJlZCgn5pyN5Yqh77ya5ZCv5Yqo5aSx6LSlJyksIHRoaXMuc2VydmljZS5uYW1lLCBlcnIpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fc3RvcCgpO1xuXG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5YGc5q2i5pyN5Yqh44CCICAgIFxuICAgICAqIOWmguaenOaKm+WHuuW8guW4uOWImeS4gOWumuaYr+ivpeeoi+W6j+WGhemDqOmAu+i+kemUmeivryAgICAgIFxuICAgICAqIOi/meS4quaWueazleS7heS+m+WGhemDqOS9v+eUqOOAglxuICAgICAqL1xuICAgIGFzeW5jIF9zdG9wKCkge1xuICAgICAgICAvL+ehruS/neS4jeS8mumHjeWkjeWBnOatolxuICAgICAgICBpZiAodGhpcy5fc3RhdHVzID09PSBSdW5uaW5nU3RhdHVzLnN0b3BwaW5nIHx8IHRoaXMuX3N0YXR1cyA9PT0gUnVubmluZ1N0YXR1cy5zdG9wcGVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgbG9nLnMxLmZvcm1hdChcbiAgICAgICAgICAgICAgICAgICAgYOacjeWKoe+8miR7dGhpcy5zZXJ2aWNlLm5hbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgJ+WcqOWkhOS6juato+WcqOWBnOatouaIluW3suWBnOatoueahOeKtuaAgeS4i+WPiOWGjeasoeiiq+WBnOatouOAgicsXG4gICAgICAgICAgICAgICAgICAgIGDlvZPliY3nmoTnirbmgIHkuLrvvJoke1J1bm5pbmdTdGF0dXNbdGhpcy5fc3RhdHVzXX1gXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsb2cuczEubChsb2cuY2hhbGsuYmx1ZSgn5pyN5Yqh77ya5byA5aeL5YGc5q2iJyksIHRoaXMuc2VydmljZS5uYW1lKTtcbiAgICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMuc3RvcHBpbmc7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2VydmljZS5vblN0b3AoKTtcblxuICAgICAgICAgICAgbG9nLnMxLmwobG9nLmNoYWxrLmdyZWVuKCfmnI3liqHvvJrmiJDlip/lgZzmraInKSwgdGhpcy5zZXJ2aWNlLm5hbWUpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGxvZy5zMS5lKGxvZy5jaGFsay5yZWQoJ+acjeWKoe+8muWBnOatouWksei0pScpLCB0aGlzLnNlcnZpY2UubmFtZSwgZXJyKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZDtcbiAgICAgICAgICAgIHRoaXMuc2VydmljZS5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCB0aGlzLl9lcnJvckxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWBpeW6t+ajgOafpeOAglxuICAgICAqIOWmguaenOaKm+WHuuW8guW4uOWImeS4gOWumuaYr+ivpeeoi+W6j+WGhemDqOmAu+i+kemUmeivryAgICAgIFxuICAgICAqIOi/meS4quaWueazleS7heS+m+WGhemDqOS9v+eUqOOAglxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHsoUHJvbWlzZTxFcnJvciB8IHZvaWQ+KX0g5YGl5bq35qOA5p+l5Ye6546w55qE6ZSZ6K+vXG4gICAgICovXG4gICAgYXN5bmMgX2hlYWx0aENoZWNrKCk6IFByb21pc2U8RXJyb3IgfCB2b2lkPiB7XG4gICAgICAgIC8vIOehruS/neWPquajgOafpei/kOihjOeKtuWGteS4i+eahOWBpeW6t+eKtuaAgVxuICAgICAgICBpZiAodGhpcy5fc3RhdHVzICE9PSBSdW5uaW5nU3RhdHVzLnJ1bm5pbmcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBsb2cuczEuZm9ybWF0KFxuICAgICAgICAgICAgICAgICAgICBg5pyN5Yqh77yaJHt0aGlzLnNlcnZpY2UubmFtZX1gLFxuICAgICAgICAgICAgICAgICAgICAn5Zyo6Z2e6L+Q6KGM54q25oCB5LiL6L+b6KGM5LqG5YGl5bq35qOA5p+l44CCJyxcbiAgICAgICAgICAgICAgICAgICAgYOW9k+WJjeeahOeKtuaAgeS4uu+8miR7UnVubmluZ1N0YXR1c1t0aGlzLl9zdGF0dXNdfWBcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2VydmljZS5vbkhlYWx0aENoZWNraW5nKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgbG9nLnMxLncoYOacjeWKoe+8miR7dGhpcy5zZXJ2aWNlLm5hbWV9YCwgJ+i/kOihjOeKtuWGteW8guW4uO+8micsIGVycik7XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICB9XG4gICAgfVxufSJdfQ==