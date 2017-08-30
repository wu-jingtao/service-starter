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
            throw new Error(`[服务：${this.service.name}] 在还未完全关闭的情况下又再次被启动。当前的状态为：${RunningStatus_1.RunningStatus[this._status]}`);
        }
        try {
            Log_1.log.starting('开始启动', this.service.name);
            this._status = RunningStatus_1.RunningStatus.starting;
            await this.service.onStart();
            this.service.on('error', this._errorListener);
            Log_1.log.started('成功启动', this.service.name);
            this._status = RunningStatus_1.RunningStatus.running;
        }
        catch (err) {
            Log_1.log.startFailed('启动失败', this.service.name, err);
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
            throw new Error(`[服务：${this.service.name}] 在处于正在停止或已停止的状态下又再次被停止。当前的状态为：${RunningStatus_1.RunningStatus[this._status]}`);
        }
        try {
            Log_1.log.stopping('开始停止', this.service.name);
            this._status = RunningStatus_1.RunningStatus.stopping;
            await this.service.onStop();
            Log_1.log.stopped('成功停止', this.service.name);
        }
        catch (err) {
            Log_1.log.stopFailed('停止失败', this.service.name, err);
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
        // 未启动时直接算是健康
        if (this._status !== RunningStatus_1.RunningStatus.running) {
            throw new Error(`[服务：${this.service.name}] 在非运行状态下进行了健康检查。当前的状态为：${RunningStatus_1.RunningStatus[this._status]}`);
        }
        try {
            await this.service.onHealthChecking();
        }
        catch (err) {
            Log_1.log.w(`[服务：${this.service.name}]`, '运行状况异常：', err);
            return err;
        }
    }
}
exports.RegisteredService = RegisteredService;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlJlZ2lzdGVyZWRTZXJ2aWNlL1JlZ2lzdGVyZWRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsb0RBQWlEO0FBQ2pELGdDQUE2QjtBQUU3Qjs7Ozs7R0FLRztBQUNIO0lBMkNJLFlBQVksT0FBc0IsRUFBRSxPQUF3QjtRQXBDNUQ7Ozs7V0FJRztRQUNjLG1CQUFjLEdBQUcsS0FBSyxFQUFFLEdBQVU7WUFDL0MsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUU5QyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNaLEtBQUssS0FBSztvQkFDTixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUN6QyxLQUFLLENBQUM7Z0JBQ1YsS0FBSyxJQUFJO29CQUNMLEtBQUssQ0FBQztnQkFDVjtvQkFDSSxFQUFFLENBQUMsQ0FBQyxLQUFLLFlBQVksS0FBSyxDQUFDO3dCQUN2QixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUMvQyxLQUFLLENBQUM7WUFDZCxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBZU0sWUFBTyxHQUFrQiw2QkFBYSxDQUFDLE9BQU8sQ0FBQztRQUduRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUV4QixXQUFXO1FBQ1gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDO0lBQzNDLENBQUM7SUFkRDs7T0FFRztJQUNILElBQVcsTUFBTTtRQUNiLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3hCLENBQUM7SUFXRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsTUFB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LE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN0RyxDQUFDO1FBRUQsSUFBSSxDQUFDO1lBQ0QsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDMUMsQ0FBQztRQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDWCxTQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsRUFBRSxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLEdBQUcsQ0FBQztRQUNmLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUEvSEQsOENBK0hDIiwiZmlsZSI6IlJlZ2lzdGVyZWRTZXJ2aWNlL1JlZ2lzdGVyZWRTZXJ2aWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2VydmljZU1vZHVsZSB9IGZyb20gXCIuLi9TZXJ2aWNlTW9kdWxlL1NlcnZpY2VNb2R1bGVcIjtcbmltcG9ydCB7IFNlcnZpY2VzTWFuYWdlciB9IGZyb20gXCIuLi9TZXJ2aWNlc01hbmFnZXIvU2VydmljZXNNYW5hZ2VyXCI7XG5pbXBvcnQgeyBSdW5uaW5nU3RhdHVzIH0gZnJvbSBcIi4uL1J1bm5pbmdTdGF0dXNcIjtcbmltcG9ydCB7IGxvZyB9IGZyb20gXCIuLi9Mb2dcIjtcblxuLyoqXG4gKiDlr7nms6jlhozkuobnmoTmnI3liqHov5vooYzkuIDlsYLlsIHoo4XvvIzkvr/kuo5TZXJ2aWNlc01hbmFnZXLkvb/nlKjjgIJcbiAqIOWvueS6juazqOWGjOacjeWKoeeahOeUn+WRveWRqOacn+i/m+ihjOeuoeeQhuOAglxuICogXG4gKiBAY2xhc3MgUmVnaXN0ZXJlZFNlcnZpY2VcbiAqL1xuZXhwb3J0IGNsYXNzIFJlZ2lzdGVyZWRTZXJ2aWNlIHtcblxuICAgIC8qKlxuICAgICAqIOS/neWtmOWvueacjeWKoeeuoeeQhuWZqOeahOW8leeUqFxuICAgICAqL1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX21hbmFnZXI6IFNlcnZpY2VzTWFuYWdlcjtcblxuICAgIC8qKlxuICAgICAqIOe7keWumuWcqOacjeWKoeS4iueahOmUmeivr+ebkeWQrOWZqOOAglxuICAgICAqIFxuICAgICAqIEB0eXBlIHtGdW5jdGlvbn1cbiAgICAgKi9cbiAgICBwcml2YXRlIHJlYWRvbmx5IF9lcnJvckxpc3RlbmVyID0gYXN5bmMgKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBhd2FpdCB0aGlzLnNlcnZpY2Uub25FcnJvcihlcnIpO1xuXG4gICAgICAgIHN3aXRjaCAodmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgZmFsc2U6XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFuYWdlci5vbkVycm9yKGVyciwgdGhpcy5zZXJ2aWNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgdHJ1ZTpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRXJyb3IpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21hbmFnZXIub25FcnJvcih2YWx1ZSwgdGhpcy5zZXJ2aWNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiDmnI3liqHlrp7kvotcbiAgICAgKiBcbiAgICAgKiBAdHlwZSB7U2VydmljZU1vZHVsZX1cbiAgICAgKi9cbiAgICByZWFkb25seSBzZXJ2aWNlOiBTZXJ2aWNlTW9kdWxlO1xuXG4gICAgLyoqXG4gICAgICog5pyN5Yqh55qE6L+Q6KGM54q25oCBXG4gICAgICovXG4gICAgcHVibGljIGdldCBzdGF0dXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXM7XG4gICAgfVxuICAgIHByaXZhdGUgX3N0YXR1czogUnVubmluZ1N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZDtcblxuICAgIGNvbnN0cnVjdG9yKHNlcnZpY2U6IFNlcnZpY2VNb2R1bGUsIG1hbmFnZXI6IFNlcnZpY2VzTWFuYWdlcikge1xuICAgICAgICB0aGlzLnNlcnZpY2UgPSBzZXJ2aWNlO1xuICAgICAgICB0aGlzLl9tYW5hZ2VyID0gbWFuYWdlcjtcblxuICAgICAgICAvLyDnu5nmnI3liqHnu5HlrprnrqHnkIblmahcbiAgICAgICAgdGhpcy5zZXJ2aWNlLnNlcnZpY2VzTWFuYWdlciA9IG1hbmFnZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5ZCv5Yqo5pyN5Yqh44CC5oiQ5Yqf6L+U5Zuedm9pZO+8jOWksei0pei/lOWbnkVycm9y44CCICAgIFxuICAgICAqIOWmguaenOaKm+WHuuW8guW4uOWImeS4gOWumuaYr+ivpeeoi+W6j+WGhemDqOmAu+i+kemUmeivryAgICAgIFxuICAgICAqIOi/meS4quaWueazleS7heS+m+WGhemDqOS9v+eUqOOAglxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPEVycm9yIHwgdm9pZD59IFxuICAgICAqL1xuICAgIGFzeW5jIF9zdGFydCgpOiBQcm9taXNlPEVycm9yIHwgdm9pZD4ge1xuICAgICAgICAvL+ehruS/neWPquacieWcqHN0b3BwZWTnmoTmg4XlhrXkuIvmiY3og73miafooYxfc3RhcnRcbiAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5zdG9wcGVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFvmnI3liqHvvJoke3RoaXMuc2VydmljZS5uYW1lfV0g5Zyo6L+Y5pyq5a6M5YWo5YWz6Zet55qE5oOF5Ya15LiL5Y+I5YaN5qyh6KKr5ZCv5Yqo44CC5b2T5YmN55qE54q25oCB5Li677yaJHtSdW5uaW5nU3RhdHVzW3RoaXMuX3N0YXR1c119YCk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbG9nLnN0YXJ0aW5nKCflvIDlp4vlkK/liqgnLCB0aGlzLnNlcnZpY2UubmFtZSk7XG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0YXJ0aW5nO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNlcnZpY2Uub25TdGFydCgpO1xuICAgICAgICAgICAgdGhpcy5zZXJ2aWNlLm9uKCdlcnJvcicsIHRoaXMuX2Vycm9yTGlzdGVuZXIpO1xuXG4gICAgICAgICAgICBsb2cuc3RhcnRlZCgn5oiQ5Yqf5ZCv5YqoJywgdGhpcy5zZXJ2aWNlLm5hbWUpO1xuICAgICAgICAgICAgdGhpcy5fc3RhdHVzID0gUnVubmluZ1N0YXR1cy5ydW5uaW5nO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGxvZy5zdGFydEZhaWxlZCgn5ZCv5Yqo5aSx6LSlJywgdGhpcy5zZXJ2aWNlLm5hbWUsIGVycik7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9zdG9wKCk7XG5cbiAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlgZzmraLmnI3liqHjgIIgICAgXG4gICAgICog5aaC5p6c5oqb5Ye65byC5bi45YiZ5LiA5a6a5piv6K+l56iL5bqP5YaF6YOo6YC76L6R6ZSZ6K+vICAgICAgXG4gICAgICog6L+Z5Liq5pa55rOV5LuF5L6b5YaF6YOo5L2/55So44CCXG4gICAgICovXG4gICAgYXN5bmMgX3N0b3AoKSB7XG4gICAgICAgIC8v56Gu5L+d5LiN5Lya6YeN5aSN5YGc5q2iXG4gICAgICAgIGlmICh0aGlzLl9zdGF0dXMgPT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBpbmcgfHwgdGhpcy5fc3RhdHVzID09PSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgW+acjeWKoe+8miR7dGhpcy5zZXJ2aWNlLm5hbWV9XSDlnKjlpITkuo7mraPlnKjlgZzmraLmiJblt7LlgZzmraLnmoTnirbmgIHkuIvlj4jlho3mrKHooqvlgZzmraLjgILlvZPliY3nmoTnirbmgIHkuLrvvJoke1J1bm5pbmdTdGF0dXNbdGhpcy5fc3RhdHVzXX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsb2cuc3RvcHBpbmcoJ+W8gOWni+WBnOatoicsIHRoaXMuc2VydmljZS5uYW1lKTtcbiAgICAgICAgICAgIHRoaXMuX3N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMuc3RvcHBpbmc7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2VydmljZS5vblN0b3AoKTtcblxuICAgICAgICAgICAgbG9nLnN0b3BwZWQoJ+aIkOWKn+WBnOatoicsIHRoaXMuc2VydmljZS5uYW1lKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBsb2cuc3RvcEZhaWxlZCgn5YGc5q2i5aSx6LSlJywgdGhpcy5zZXJ2aWNlLm5hbWUsIGVycik7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQ7XG4gICAgICAgICAgICB0aGlzLnNlcnZpY2UucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgdGhpcy5fZXJyb3JMaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlgaXlurfmo4Dmn6XjgIJcbiAgICAgKiDlpoLmnpzmipvlh7rlvILluLjliJnkuIDlrprmmK/or6XnqIvluo/lhoXpg6jpgLvovpHplJnor68gICAgICBcbiAgICAgKiDov5nkuKrmlrnms5Xku4XkvpvlhoXpg6jkvb/nlKjjgIJcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7KFByb21pc2U8RXJyb3IgfCB2b2lkPil9IOWBpeW6t+ajgOafpeWHuueOsOeahOmUmeivr1xuICAgICAqL1xuICAgIGFzeW5jIF9oZWFsdGhDaGVjaygpOiBQcm9taXNlPEVycm9yIHwgdm9pZD4ge1xuICAgICAgICAvLyDmnKrlkK/liqjml7bnm7TmjqXnrpfmmK/lgaXlurdcbiAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyAhPT0gUnVubmluZ1N0YXR1cy5ydW5uaW5nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFvmnI3liqHvvJoke3RoaXMuc2VydmljZS5uYW1lfV0g5Zyo6Z2e6L+Q6KGM54q25oCB5LiL6L+b6KGM5LqG5YGl5bq35qOA5p+l44CC5b2T5YmN55qE54q25oCB5Li677yaJHtSdW5uaW5nU3RhdHVzW3RoaXMuX3N0YXR1c119YCk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXJ2aWNlLm9uSGVhbHRoQ2hlY2tpbmcoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBsb2cudyhgW+acjeWKoe+8miR7dGhpcy5zZXJ2aWNlLm5hbWV9XWAsICfov5DooYznirblhrXlvILluLjvvJonLCBlcnIpO1xuICAgICAgICAgICAgcmV0dXJuIGVycjtcbiAgICAgICAgfVxuICAgIH1cbn0iXX0=
