"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Log_1 = require("../Log");
/**
 * 对注册了的服务进行一层封装，便于ServicesManager使用。
 * 对于注册服务的异常与状态进行处理。
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
        this._isStarted = false;
        this.service = service;
        this._manager = manager;
        // 给服务绑定管理器
        this.service.servicesManager = manager;
    }
    /**
     * 服务是否已启动
     *
     * @type {boolean}
     */
    get isStarted() {
        return this._isStarted;
    }
    /**
     * 启动服务。成功返回true，失败返回false
     * 这个方法不会抛出异常
     *
     * @returns {Promise<boolean>}
     */
    async start() {
        //确保不会重复启动
        if (this._isStarted)
            return true;
        try {
            Log_1.log.starting('开始启动', this.service.name);
            await this.service.onStart();
            this.service.on('error', this._errorListener);
            this._isStarted = true;
            Log_1.log.started('成功启动', this.service.name);
            return true;
        }
        catch (err) {
            Log_1.log.startFailed('启动失败', this.service.name, err);
            await this.stop(true);
            return false;
        }
    }
    /**
     * 停止服务。这个方法不会抛出异常
     *
     * @param {boolean} [force=false] 是否强制执行
     */
    async stop(force = false) {
        //确保不会重复停止
        if (force === false && this._isStarted === false)
            return;
        try {
            Log_1.log.stopping('开始停止', this.service.name);
            await this.service.onStop();
            Log_1.log.stopped('成功停止', this.service.name);
        }
        catch (err) {
            Log_1.log.stopFailed('停止失败', this.service.name, err);
        }
        finally {
            this._isStarted = false;
            this.service.removeListener('error', this._errorListener);
        }
    }
    /**
     * 健康检查。这个方法不抛出异常
     *
     * @returns {(Promise<Error | void>)} 健康检查出现的错误
     * @memberof RegisteredService
     */
    async healthCheck() {
        // 未启动时直接算是健康
        if (this._isStarted === false)
            return;
        try {
            await this.service.onHealthChecking();
        }
        catch (err) {
            Log_1.log.w('服务', this.service.name, '的运行状况异常：', err);
            return err;
        }
    }
}
exports.RegisteredService = RegisteredService;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlJlZ2lzdGVyZWRTZXJ2aWNlL1JlZ2lzdGVyZWRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsZ0NBQTZCO0FBRTdCOzs7OztHQUtHO0FBQ0g7SUE2Q0ksWUFBWSxPQUFzQixFQUFFLE9BQXdCO1FBdEM1RDs7OztXQUlHO1FBQ2MsbUJBQWMsR0FBRyxLQUFLLEVBQUUsR0FBVTtZQUMvQyxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRTlDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ1osS0FBSyxLQUFLO29CQUNOLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3pDLEtBQUssQ0FBQztnQkFDVixLQUFLLElBQUk7b0JBQ0wsS0FBSyxDQUFDO2dCQUNWO29CQUNJLEVBQUUsQ0FBQyxDQUFDLEtBQUssWUFBWSxLQUFLLENBQUM7d0JBQ3ZCLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQy9DLEtBQUssQ0FBQztZQUNkLENBQUM7UUFDTCxDQUFDLENBQUM7UUFpQk0sZUFBVSxHQUFZLEtBQUssQ0FBQztRQUdoQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUV4QixXQUFXO1FBQ1gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDO0lBQzNDLENBQUM7SUFoQkQ7Ozs7T0FJRztJQUNILElBQVcsU0FBUztRQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztJQUMzQixDQUFDO0lBV0Q7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsS0FBSztRQUNQLFVBQVU7UUFDVixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUVqQyxJQUFJLENBQUM7WUFDRCxTQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM3QixJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzlDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ3ZCLFNBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFdkMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNYLFNBQUcsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUV0QixNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ2pCLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUs7UUFDcEIsVUFBVTtRQUNWLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBSyxLQUFLLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxLQUFLLENBQUM7WUFBQyxNQUFNLENBQUM7UUFFekQsSUFBSSxDQUFDO1lBQ0QsU0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4QyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDNUIsU0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNYLFNBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ25ELENBQUM7Z0JBQVMsQ0FBQztZQUNQLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDOUQsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxXQUFXO1FBQ2IsYUFBYTtRQUNiLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLEtBQUssS0FBSyxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBRXRDLElBQUksQ0FBQztZQUNELE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQzFDLENBQUM7UUFBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ1gsU0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDZixDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBckhELDhDQXFIQyIsImZpbGUiOiJSZWdpc3RlcmVkU2VydmljZS9SZWdpc3RlcmVkU2VydmljZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNlcnZpY2VNb2R1bGUgfSBmcm9tIFwiLi4vU2VydmljZU1vZHVsZS9TZXJ2aWNlTW9kdWxlXCI7XG5pbXBvcnQgeyBTZXJ2aWNlc01hbmFnZXIgfSBmcm9tIFwiLi4vU2VydmljZXNNYW5hZ2VyL1NlcnZpY2VzTWFuYWdlclwiO1xuaW1wb3J0IHsgbG9nIH0gZnJvbSBcIi4uL0xvZ1wiO1xuXG4vKipcbiAqIOWvueazqOWGjOS6hueahOacjeWKoei/m+ihjOS4gOWxguWwgeijhe+8jOS+v+S6jlNlcnZpY2VzTWFuYWdlcuS9v+eUqOOAglxuICog5a+55LqO5rOo5YaM5pyN5Yqh55qE5byC5bi45LiO54q25oCB6L+b6KGM5aSE55CG44CCXG4gKiBcbiAqIEBjbGFzcyBSZWdpc3RlcmVkU2VydmljZVxuICovXG5leHBvcnQgY2xhc3MgUmVnaXN0ZXJlZFNlcnZpY2Uge1xuXG4gICAgLyoqXG4gICAgICog5L+d5a2Y5a+55pyN5Yqh566h55CG5Zmo55qE5byV55SoXG4gICAgICovXG4gICAgcHJpdmF0ZSByZWFkb25seSBfbWFuYWdlcjogU2VydmljZXNNYW5hZ2VyO1xuXG4gICAgLyoqXG4gICAgICog57uR5a6a5Zyo5pyN5Yqh5LiK55qE6ZSZ6K+v55uR5ZCs5Zmo44CCXG4gICAgICogXG4gICAgICogQHR5cGUge0Z1bmN0aW9ufVxuICAgICAqL1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX2Vycm9yTGlzdGVuZXIgPSBhc3luYyAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IHRoaXMuc2VydmljZS5vbkVycm9yKGVycik7XG5cbiAgICAgICAgc3dpdGNoICh2YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBmYWxzZTpcbiAgICAgICAgICAgICAgICB0aGlzLl9tYW5hZ2VyLm9uRXJyb3IoZXJyLCB0aGlzLnNlcnZpY2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSB0cnVlOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFcnJvcilcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFuYWdlci5vbkVycm9yKHZhbHVlLCB0aGlzLnNlcnZpY2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIOacjeWKoeWunuS+i1xuICAgICAqIFxuICAgICAqIEB0eXBlIHtTZXJ2aWNlTW9kdWxlfVxuICAgICAqL1xuICAgIHJlYWRvbmx5IHNlcnZpY2U6IFNlcnZpY2VNb2R1bGU7XG5cbiAgICAvKipcbiAgICAgKiDmnI3liqHmmK/lkKblt7LlkK/liqhcbiAgICAgKiBcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IGlzU3RhcnRlZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzU3RhcnRlZDtcbiAgICB9XG4gICAgcHJpdmF0ZSBfaXNTdGFydGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICBjb25zdHJ1Y3RvcihzZXJ2aWNlOiBTZXJ2aWNlTW9kdWxlLCBtYW5hZ2VyOiBTZXJ2aWNlc01hbmFnZXIpIHtcbiAgICAgICAgdGhpcy5zZXJ2aWNlID0gc2VydmljZTtcbiAgICAgICAgdGhpcy5fbWFuYWdlciA9IG1hbmFnZXI7XG5cbiAgICAgICAgLy8g57uZ5pyN5Yqh57uR5a6a566h55CG5ZmoXG4gICAgICAgIHRoaXMuc2VydmljZS5zZXJ2aWNlc01hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWQr+WKqOacjeWKoeOAguaIkOWKn+i/lOWbnnRydWXvvIzlpLHotKXov5Tlm55mYWxzZSAgIFxuICAgICAqIOi/meS4quaWueazleS4jeS8muaKm+WHuuW8guW4uFxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPGJvb2xlYW4+fSBcbiAgICAgKi9cbiAgICBhc3luYyBzdGFydCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgLy/noa7kv53kuI3kvJrph43lpI3lkK/liqhcbiAgICAgICAgaWYgKHRoaXMuX2lzU3RhcnRlZCkgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvZy5zdGFydGluZygn5byA5aeL5ZCv5YqoJywgdGhpcy5zZXJ2aWNlLm5hbWUpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXJ2aWNlLm9uU3RhcnQoKTtcbiAgICAgICAgICAgIHRoaXMuc2VydmljZS5vbignZXJyb3InLCB0aGlzLl9lcnJvckxpc3RlbmVyKTtcbiAgICAgICAgICAgIHRoaXMuX2lzU3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBsb2cuc3RhcnRlZCgn5oiQ5Yqf5ZCv5YqoJywgdGhpcy5zZXJ2aWNlLm5hbWUpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBsb2cuc3RhcnRGYWlsZWQoJ+WQr+WKqOWksei0pScsIHRoaXMuc2VydmljZS5uYW1lLCBlcnIpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9wKHRydWUpO1xuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlgZzmraLmnI3liqHjgILov5nkuKrmlrnms5XkuI3kvJrmipvlh7rlvILluLhcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtmb3JjZT1mYWxzZV0g5piv5ZCm5by65Yi25omn6KGMXG4gICAgICovXG4gICAgYXN5bmMgc3RvcChmb3JjZSA9IGZhbHNlKSB7XG4gICAgICAgIC8v56Gu5L+d5LiN5Lya6YeN5aSN5YGc5q2iXG4gICAgICAgIGlmIChmb3JjZSA9PT0gZmFsc2UgJiYgdGhpcy5faXNTdGFydGVkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsb2cuc3RvcHBpbmcoJ+W8gOWni+WBnOatoicsIHRoaXMuc2VydmljZS5uYW1lKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2VydmljZS5vblN0b3AoKTtcbiAgICAgICAgICAgIGxvZy5zdG9wcGVkKCfmiJDlip/lgZzmraInLCB0aGlzLnNlcnZpY2UubmFtZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgbG9nLnN0b3BGYWlsZWQoJ+WBnOatouWksei0pScsIHRoaXMuc2VydmljZS5uYW1lLCBlcnIpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5faXNTdGFydGVkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnNlcnZpY2UucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgdGhpcy5fZXJyb3JMaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlgaXlurfmo4Dmn6XjgILov5nkuKrmlrnms5XkuI3mipvlh7rlvILluLhcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7KFByb21pc2U8RXJyb3IgfCB2b2lkPil9IOWBpeW6t+ajgOafpeWHuueOsOeahOmUmeivr1xuICAgICAqIEBtZW1iZXJvZiBSZWdpc3RlcmVkU2VydmljZVxuICAgICAqL1xuICAgIGFzeW5jIGhlYWx0aENoZWNrKCk6IFByb21pc2U8RXJyb3IgfCB2b2lkPiB7XG4gICAgICAgIC8vIOacquWQr+WKqOaXtuebtOaOpeeul+aYr+WBpeW6t1xuICAgICAgICBpZiAodGhpcy5faXNTdGFydGVkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNlcnZpY2Uub25IZWFsdGhDaGVja2luZygpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGxvZy53KCfmnI3liqEnLCB0aGlzLnNlcnZpY2UubmFtZSwgJ+eahOi/kOihjOeKtuWGteW8guW4uO+8micsIGVycik7XG4gICAgICAgICAgICByZXR1cm4gZXJyO1xuICAgICAgICB9XG4gICAgfVxufSJdfQ==
