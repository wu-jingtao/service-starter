"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events = require("events");
/**
 * Docker 容器健康检查的返回值
 *
 * @export
 * @enum {number}
 */
var HealthStatus;
(function (HealthStatus) {
    /**
     * 这个服务是健康的，可以使用
     */
    HealthStatus[HealthStatus["success"] = 0] = "success";
    /**
     * 这个服务现在不能正常工作了
     */
    HealthStatus[HealthStatus["unhealthy"] = 1] = "unhealthy";
})(HealthStatus = exports.HealthStatus || (exports.HealthStatus = {}));
/**
 * 所有服务的父类
 */
class ServiceModule extends events.EventEmitter {
    /**
     * 获取服务的名称（默认是类名）
     *
     * @readonly
     * @type {string}
     * @memberof ServiceModule
     */
    get name() {
        return this.constructor.name;
    }
    /**
     * 停止服务
     *
     * @returns {Promise<void>}
     * @memberof ServiceModule
     */
    onStop() {
        return Promise.resolve();
    }
    /**
     * 当该服务发生异常时，这个方法会在全局错误处理方法(ServicesManager的onError)之前被调用。
     * 注意该方法只有当服务在运行过程中发生错误时，该方法才会被调用。启动或停止服务过程中发生的错误，无法被该方法处理。
     * 返回false       ：错误将继续交由全局错误处理方法处理
     * 返回true        ：错误不再交由全局错误处理方法处理
     * 返回Error       ：替换错误的内容，将新的Error交由全局错误处理方法继续处理
     * 返回'stop'      ：停止所有服务的运行。
     *
     * @param {Error} err 服务产生的错误
     * @returns {(Error | boolean | string)}
     * @memberof ServiceModule
     */
    onError(err) {
        return false;
    }
    /**
     * 检查当前服务工作是否正常
     *
     * @returns {Promise<HealthStatus>}
     * @memberof ServiceModule
     */
    onHealthChecking() {
        return Promise.resolve(HealthStatus.success);
    }
}
exports.ServiceModule = ServiceModule;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VNb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBa0M7QUFFbEM7Ozs7O0dBS0c7QUFDSCxJQUFZLFlBVVg7QUFWRCxXQUFZLFlBQVk7SUFDcEI7O09BRUc7SUFDSCxxREFBTyxDQUFBO0lBRVA7O09BRUc7SUFDSCx5REFBUyxDQUFBO0FBQ2IsQ0FBQyxFQVZXLFlBQVksR0FBWixvQkFBWSxLQUFaLG9CQUFZLFFBVXZCO0FBRUQ7O0dBRUc7QUFDSCxtQkFBb0MsU0FBUSxNQUFNLENBQUMsWUFBWTtJQVczRDs7Ozs7O09BTUc7SUFDSCxJQUFJLElBQUk7UUFDSixNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7SUFDakMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTTtRQUNGLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsT0FBTyxDQUFDLEdBQVU7UUFDZCxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILGdCQUFnQjtRQUNaLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqRCxDQUFDO0NBQ0o7QUF6REQsc0NBeURDIiwiZmlsZSI6IlNlcnZpY2VNb2R1bGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XHJcblxyXG4vKipcclxuICogRG9ja2VyIOWuueWZqOWBpeW6t+ajgOafpeeahOi/lOWbnuWAvFxyXG4gKiBcclxuICogQGV4cG9ydFxyXG4gKiBAZW51bSB7bnVtYmVyfVxyXG4gKi9cclxuZXhwb3J0IGVudW0gSGVhbHRoU3RhdHVzIHtcclxuICAgIC8qKlxyXG4gICAgICog6L+Z5Liq5pyN5Yqh5piv5YGl5bq355qE77yM5Y+v5Lul5L2/55SoXHJcbiAgICAgKi9cclxuICAgIHN1Y2Nlc3MsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDov5nkuKrmnI3liqHnjrDlnKjkuI3og73mraPluLjlt6XkvZzkuoZcclxuICAgICAqL1xyXG4gICAgdW5oZWFsdGh5XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDmiYDmnInmnI3liqHnmoTniLbnsbtcclxuICovXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTZXJ2aWNlTW9kdWxlIGV4dGVuZHMgZXZlbnRzLkV2ZW50RW1pdHRlciB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlkK/liqjmnI3liqFcclxuICAgICAqIFxyXG4gICAgICogQGFic3RyYWN0XHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gXHJcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZU1vZHVsZVxyXG4gICAgICovXHJcbiAgICBhYnN0cmFjdCBvblN0YXJ0KCk6IFByb21pc2U8dm9pZD47XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDojrflj5bmnI3liqHnmoTlkI3np7DvvIjpu5jorqTmmK/nsbvlkI3vvIlcclxuICAgICAqIFxyXG4gICAgICogQHJlYWRvbmx5XHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VNb2R1bGVcclxuICAgICAqL1xyXG4gICAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5YGc5q2i5pyN5YqhXHJcbiAgICAgKiBcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBcclxuICAgICAqIEBtZW1iZXJvZiBTZXJ2aWNlTW9kdWxlXHJcbiAgICAgKi9cclxuICAgIG9uU3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlvZPor6XmnI3liqHlj5HnlJ/lvILluLjml7bvvIzov5nkuKrmlrnms5XkvJrlnKjlhajlsYDplJnor6/lpITnkIbmlrnms5UoU2VydmljZXNNYW5hZ2Vy55qEb25FcnJvcinkuYvliY3ooqvosIPnlKjjgIJcclxuICAgICAqIOazqOaEj+ivpeaWueazleWPquacieW9k+acjeWKoeWcqOi/kOihjOi/h+eoi+S4reWPkeeUn+mUmeivr+aXtu+8jOivpeaWueazleaJjeS8muiiq+iwg+eUqOOAguWQr+WKqOaIluWBnOatouacjeWKoei/h+eoi+S4reWPkeeUn+eahOmUmeivr++8jOaXoOazleiiq+ivpeaWueazleWkhOeQhuOAglxyXG4gICAgICog6L+U5ZueZmFsc2UgICAgICAg77ya6ZSZ6K+v5bCG57un57ut5Lqk55Sx5YWo5bGA6ZSZ6K+v5aSE55CG5pa55rOV5aSE55CGXHJcbiAgICAgKiDov5Tlm550cnVlICAgICAgICDvvJrplJnor6/kuI3lho3kuqTnlLHlhajlsYDplJnor6/lpITnkIbmlrnms5XlpITnkIZcclxuICAgICAqIOi/lOWbnkVycm9yICAgICAgIO+8muabv+aNoumUmeivr+eahOWGheWuue+8jOWwhuaWsOeahEVycm9y5Lqk55Sx5YWo5bGA6ZSZ6K+v5aSE55CG5pa55rOV57un57ut5aSE55CGXHJcbiAgICAgKiDov5Tlm54nc3RvcCcgICAgICDvvJrlgZzmraLmiYDmnInmnI3liqHnmoTov5DooYzjgIJcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtFcnJvcn0gZXJyIOacjeWKoeS6p+eUn+eahOmUmeivr1xyXG4gICAgICogQHJldHVybnMgeyhFcnJvciB8IGJvb2xlYW4gfCBzdHJpbmcpfSBcclxuICAgICAqIEBtZW1iZXJvZiBTZXJ2aWNlTW9kdWxlXHJcbiAgICAgKi9cclxuICAgIG9uRXJyb3IoZXJyOiBFcnJvcik6IEVycm9yIHwgYm9vbGVhbiB8IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5qOA5p+l5b2T5YmN5pyN5Yqh5bel5L2c5piv5ZCm5q2j5bi4XHJcbiAgICAgKiBcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPEhlYWx0aFN0YXR1cz59IFxyXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VNb2R1bGVcclxuICAgICAqL1xyXG4gICAgb25IZWFsdGhDaGVja2luZygpOiBQcm9taXNlPEhlYWx0aFN0YXR1cz4ge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoSGVhbHRoU3RhdHVzLnN1Y2Nlc3MpO1xyXG4gICAgfVxyXG59Il19
