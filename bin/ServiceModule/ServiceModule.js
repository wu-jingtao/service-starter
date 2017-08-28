"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events = require("events");
const HealthStatus_1 = require("./HealthStatus");
/**
 * 所有服务的父类
 * 注意：onStart()和onStop()发生的错误，直接通过在promise中抛出错误来解决。
 * 启动之后在运行过程中出现的错误，通过this.emit('error')来处理。
 */
class ServiceModule extends events.EventEmitter {
    /**
     * 获取服务的名称（默认是类名）
     *
     * @readonly
     * @type {string}
     */
    get name() {
        return this.constructor.name;
    }
    /**
     * 对于服务管理器中注册了的服务的引用
     * 当服务注册之后，服务管理器会自动对该属性进行绑定
     */
    get _services() {
        return this._servicesManager._services;
    }
    /**
     * 停止服务
     *
     * @returns {Promise<void>}
     */
    onStop() {
        return Promise.resolve();
    }
    /**
     * 当该服务发生异常时，这个方法会在全局错误处理方法(ServicesManager的onError)之前被调用。
     * 注意该方法只有当服务在运行过程中发生错误时（通过this.emit('error')触发的错误），该方法才会被调用。
     *
     * 返回false       ：错误将继续交由全局错误处理方法处理
     * 返回true        ：错误不再交由全局错误处理方法处理
     * 返回Error       ：替换错误的内容，将新的Error交由全局错误处理方法继续处理
     * 返回'stop'      ：停止所有服务的运行。
     *
     * @param err 触发的错误对象
     */
    onError(err) {
        return Promise.resolve(false);
    }
    /**
     * 检查当前服务工作是否正常
     *
     * @returns {Promise<HealthStatus>}
     */
    onHealthChecking() {
        return Promise.resolve(HealthStatus_1.HealthStatus.success);
    }
}
exports.ServiceModule = ServiceModule;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VNb2R1bGUvU2VydmljZU1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUFrQztBQUNsQyxpREFBOEM7QUFLOUM7Ozs7R0FJRztBQUNILG1CQUFvQyxTQUFRLE1BQU0sQ0FBQyxZQUFZO0lBRTNEOzs7OztPQUtHO0lBQ0gsSUFBSSxJQUFJO1FBQ0osTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO0lBQ2pDLENBQUM7SUFRRDs7O09BR0c7SUFDSCxJQUFJLFNBQVM7UUFDVCxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQztJQUMzQyxDQUFDO0lBVUQ7Ozs7T0FJRztJQUNILE1BQU07UUFDRixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzdCLENBQUM7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0gsT0FBTyxDQUFDLEdBQVU7UUFDZCxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILGdCQUFnQjtRQUNaLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLDJCQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDakQsQ0FBQztDQUNKO0FBbEVELHNDQWtFQyIsImZpbGUiOiJTZXJ2aWNlTW9kdWxlL1NlcnZpY2VNb2R1bGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XG5pbXBvcnQgeyBIZWFsdGhTdGF0dXMgfSBmcm9tIFwiLi9IZWFsdGhTdGF0dXNcIjtcbmltcG9ydCB7IFJlZ2lzdGVyZWRTZXJ2aWNlIH0gZnJvbSBcIi4uL1NlcnZpY2VzTWFuYWdlci9SZWdpc3RlcmVkU2VydmljZVwiO1xuaW1wb3J0IHsgU2VydmljZXNNYW5hZ2VyIH0gZnJvbSBcIi4uL1NlcnZpY2VzTWFuYWdlci9TZXJ2aWNlc01hbmFnZXJcIjtcblxuXG4vKipcbiAqIOaJgOacieacjeWKoeeahOeItuexuyAgICBcbiAqIOazqOaEj++8mm9uU3RhcnQoKeWSjG9uU3RvcCgp5Y+R55Sf55qE6ZSZ6K+v77yM55u05o6l6YCa6L+H5ZyocHJvbWlzZeS4reaKm+WHuumUmeivr+adpeino+WGs+OAglxuICog5ZCv5Yqo5LmL5ZCO5Zyo6L+Q6KGM6L+H56iL5Lit5Ye6546w55qE6ZSZ6K+v77yM6YCa6L+HdGhpcy5lbWl0KCdlcnJvcicp5p2l5aSE55CG44CCXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTZXJ2aWNlTW9kdWxlIGV4dGVuZHMgZXZlbnRzLkV2ZW50RW1pdHRlciB7XG5cbiAgICAvKipcbiAgICAgKiDojrflj5bmnI3liqHnmoTlkI3np7DvvIjpu5jorqTmmK/nsbvlkI3vvIlcbiAgICAgKiBcbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5a+55LqO5pyN5Yqh566h55CG5Zmo55qE5byV55So44CCICAgIFxuICAgICAqIOW9k+acjeWKoeazqOWGjOS5i+WQju+8jOacjeWKoeeuoeeQhuWZqOS8muiHquWKqOWvueivpeWxnuaAp+i/m+ihjOe7keWumlxuICAgICAqL1xuICAgIF9zZXJ2aWNlc01hbmFnZXI6IFNlcnZpY2VzTWFuYWdlcjtcblxuICAgIC8qKlxuICAgICAqIOWvueS6juacjeWKoeeuoeeQhuWZqOS4reazqOWGjOS6hueahOacjeWKoeeahOW8leeUqCAgICBcbiAgICAgKiDlvZPmnI3liqHms6jlhozkuYvlkI7vvIzmnI3liqHnrqHnkIblmajkvJroh6rliqjlr7nor6XlsZ7mgKfov5vooYznu5HlrppcbiAgICAgKi9cbiAgICBnZXQgX3NlcnZpY2VzKCk6IE1hcDxzdHJpbmcsIFJlZ2lzdGVyZWRTZXJ2aWNlPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZXJ2aWNlc01hbmFnZXIuX3NlcnZpY2VzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWQr+WKqOacjeWKoVxuICAgICAqIFxuICAgICAqIEBhYnN0cmFjdFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBcbiAgICAgKi9cbiAgICBhYnN0cmFjdCBvblN0YXJ0KCk6IFByb21pc2U8dm9pZD47XG5cbiAgICAvKipcbiAgICAgKiDlgZzmraLmnI3liqFcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gXG4gICAgICovXG4gICAgb25TdG9wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5b2T6K+l5pyN5Yqh5Y+R55Sf5byC5bi45pe277yM6L+Z5Liq5pa55rOV5Lya5Zyo5YWo5bGA6ZSZ6K+v5aSE55CG5pa55rOVKFNlcnZpY2VzTWFuYWdlcueahG9uRXJyb3Ip5LmL5YmN6KKr6LCD55So44CCICAgIFxuICAgICAqIOazqOaEj+ivpeaWueazleWPquacieW9k+acjeWKoeWcqOi/kOihjOi/h+eoi+S4reWPkeeUn+mUmeivr+aXtu+8iOmAmui/h3RoaXMuZW1pdCgnZXJyb3InKeinpuWPkeeahOmUmeivr++8ie+8jOivpeaWueazleaJjeS8muiiq+iwg+eUqOOAglxuICAgICAqIFxuICAgICAqIOi/lOWbnmZhbHNlICAgICAgIO+8mumUmeivr+Wwhue7p+e7reS6pOeUseWFqOWxgOmUmeivr+WkhOeQhuaWueazleWkhOeQhiAgIFxuICAgICAqIOi/lOWbnnRydWUgICAgICAgIO+8mumUmeivr+S4jeWGjeS6pOeUseWFqOWxgOmUmeivr+WkhOeQhuaWueazleWkhOeQhiAgIFxuICAgICAqIOi/lOWbnkVycm9yICAgICAgIO+8muabv+aNoumUmeivr+eahOWGheWuue+8jOWwhuaWsOeahEVycm9y5Lqk55Sx5YWo5bGA6ZSZ6K+v5aSE55CG5pa55rOV57un57ut5aSE55CGICAgXG4gICAgICog6L+U5ZueJ3N0b3AnICAgICAg77ya5YGc5q2i5omA5pyJ5pyN5Yqh55qE6L+Q6KGM44CCICAgXG4gICAgICogXG4gICAgICogQHBhcmFtIGVyciDop6blj5HnmoTplJnor6/lr7nosaFcbiAgICAgKi9cbiAgICBvbkVycm9yKGVycjogRXJyb3IpOiBQcm9taXNlPEVycm9yIHwgYm9vbGVhbiB8IHN0cmluZz4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmo4Dmn6XlvZPliY3mnI3liqHlt6XkvZzmmK/lkKbmraPluLhcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxIZWFsdGhTdGF0dXM+fSBcbiAgICAgKi9cbiAgICBvbkhlYWx0aENoZWNraW5nKCk6IFByb21pc2U8SGVhbHRoU3RhdHVzPiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoSGVhbHRoU3RhdHVzLnN1Y2Nlc3MpO1xuICAgIH1cbn0iXX0=
