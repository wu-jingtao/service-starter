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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VNb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBa0M7QUFFbEM7Ozs7O0dBS0c7QUFDSCxJQUFZLFlBVVg7QUFWRCxXQUFZLFlBQVk7SUFDcEI7O09BRUc7SUFDSCxxREFBTyxDQUFBO0lBRVA7O09BRUc7SUFDSCx5REFBUyxDQUFBO0FBQ2IsQ0FBQyxFQVZXLFlBQVksR0FBWixvQkFBWSxLQUFaLG9CQUFZLFFBVXZCO0FBRUQ7O0dBRUc7QUFDSCxtQkFBb0MsU0FBUSxNQUFNLENBQUMsWUFBWTtJQVczRDs7Ozs7O09BTUc7SUFDSCxJQUFJLElBQUk7UUFDSixNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7SUFDakMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTTtRQUNGLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsT0FBTyxDQUFDLEdBQVU7UUFDZCxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILGdCQUFnQjtRQUNaLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqRCxDQUFDO0NBQ0o7QUF6REQsc0NBeURDIiwiZmlsZSI6IlNlcnZpY2VNb2R1bGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XG5cbi8qKlxuICogRG9ja2VyIOWuueWZqOWBpeW6t+ajgOafpeeahOi/lOWbnuWAvFxuICogXG4gKiBAZXhwb3J0XG4gKiBAZW51bSB7bnVtYmVyfVxuICovXG5leHBvcnQgZW51bSBIZWFsdGhTdGF0dXMge1xuICAgIC8qKlxuICAgICAqIOi/meS4quacjeWKoeaYr+WBpeW6t+eahO+8jOWPr+S7peS9v+eUqFxuICAgICAqL1xuICAgIHN1Y2Nlc3MsXG5cbiAgICAvKipcbiAgICAgKiDov5nkuKrmnI3liqHnjrDlnKjkuI3og73mraPluLjlt6XkvZzkuoZcbiAgICAgKi9cbiAgICB1bmhlYWx0aHlcbn1cblxuLyoqXG4gKiDmiYDmnInmnI3liqHnmoTniLbnsbtcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFNlcnZpY2VNb2R1bGUgZXh0ZW5kcyBldmVudHMuRXZlbnRFbWl0dGVyIHtcblxuICAgIC8qKlxuICAgICAqIOWQr+WKqOacjeWKoVxuICAgICAqIFxuICAgICAqIEBhYnN0cmFjdFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZU1vZHVsZVxuICAgICAqL1xuICAgIGFic3RyYWN0IG9uU3RhcnQoKTogUHJvbWlzZTx2b2lkPjtcblxuICAgIC8qKlxuICAgICAqIOiOt+WPluacjeWKoeeahOWQjeensO+8iOm7mOiupOaYr+exu+WQje+8iVxuICAgICAqIFxuICAgICAqIEByZWFkb25seVxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VNb2R1bGVcbiAgICAgKi9cbiAgICBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWBnOatouacjeWKoVxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZU1vZHVsZVxuICAgICAqL1xuICAgIG9uU3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOW9k+ivpeacjeWKoeWPkeeUn+W8guW4uOaXtu+8jOi/meS4quaWueazleS8muWcqOWFqOWxgOmUmeivr+WkhOeQhuaWueazlShTZXJ2aWNlc01hbmFnZXLnmoRvbkVycm9yKeS5i+WJjeiiq+iwg+eUqOOAglxuICAgICAqIOazqOaEj+ivpeaWueazleWPquacieW9k+acjeWKoeWcqOi/kOihjOi/h+eoi+S4reWPkeeUn+mUmeivr+aXtu+8jOivpeaWueazleaJjeS8muiiq+iwg+eUqOOAguWQr+WKqOaIluWBnOatouacjeWKoei/h+eoi+S4reWPkeeUn+eahOmUmeivr++8jOaXoOazleiiq+ivpeaWueazleWkhOeQhuOAglxuICAgICAqIOi/lOWbnmZhbHNlICAgICAgIO+8mumUmeivr+Wwhue7p+e7reS6pOeUseWFqOWxgOmUmeivr+WkhOeQhuaWueazleWkhOeQhlxuICAgICAqIOi/lOWbnnRydWUgICAgICAgIO+8mumUmeivr+S4jeWGjeS6pOeUseWFqOWxgOmUmeivr+WkhOeQhuaWueazleWkhOeQhlxuICAgICAqIOi/lOWbnkVycm9yICAgICAgIO+8muabv+aNoumUmeivr+eahOWGheWuue+8jOWwhuaWsOeahEVycm9y5Lqk55Sx5YWo5bGA6ZSZ6K+v5aSE55CG5pa55rOV57un57ut5aSE55CGXG4gICAgICog6L+U5ZueJ3N0b3AnICAgICAg77ya5YGc5q2i5omA5pyJ5pyN5Yqh55qE6L+Q6KGM44CCXG4gICAgICogXG4gICAgICogQHBhcmFtIHtFcnJvcn0gZXJyIOacjeWKoeS6p+eUn+eahOmUmeivr1xuICAgICAqIEByZXR1cm5zIHsoRXJyb3IgfCBib29sZWFuIHwgc3RyaW5nKX0gXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VNb2R1bGVcbiAgICAgKi9cbiAgICBvbkVycm9yKGVycjogRXJyb3IpOiBFcnJvciB8IGJvb2xlYW4gfCBzdHJpbmcge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qOA5p+l5b2T5YmN5pyN5Yqh5bel5L2c5piv5ZCm5q2j5bi4XG4gICAgICogXG4gICAgICogQHJldHVybnMge1Byb21pc2U8SGVhbHRoU3RhdHVzPn0gXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VNb2R1bGVcbiAgICAgKi9cbiAgICBvbkhlYWx0aENoZWNraW5nKCk6IFByb21pc2U8SGVhbHRoU3RhdHVzPiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoSGVhbHRoU3RhdHVzLnN1Y2Nlc3MpO1xuICAgIH1cbn0iXX0=
