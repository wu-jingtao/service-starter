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
exports.default = ServiceModule;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VNb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBa0M7QUFFbEM7Ozs7O0dBS0c7QUFDSCxJQUFZLFlBVVg7QUFWRCxXQUFZLFlBQVk7SUFDcEI7O09BRUc7SUFDSCxxREFBTyxDQUFBO0lBRVA7O09BRUc7SUFDSCx5REFBUyxDQUFBO0FBQ2IsQ0FBQyxFQVZXLFlBQVksR0FBWixvQkFBWSxLQUFaLG9CQUFZLFFBVXZCO0FBRUQ7O0dBRUc7QUFDSCxtQkFBNEMsU0FBUSxNQUFNLENBQUMsWUFBWTtJQVduRTs7Ozs7O09BTUc7SUFDSCxJQUFJLElBQUk7UUFDSixNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7SUFDakMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTTtRQUNGLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsT0FBTyxDQUFDLEdBQVU7UUFDZCxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILGdCQUFnQjtRQUNaLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqRCxDQUFDO0NBQ0o7QUF6REQsZ0NBeURDIiwiZmlsZSI6IlNlcnZpY2VNb2R1bGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XHJcblxyXG4vKipcclxuICogRG9ja2VyIOWuueWZqOWBpeW6t+ajgOafpeeahOi/lOWbnuWAvFxyXG4gKiBcclxuICogQGV4cG9ydFxyXG4gKiBAZW51bSB7bnVtYmVyfVxyXG4gKi9cclxuZXhwb3J0IGVudW0gSGVhbHRoU3RhdHVzIHtcclxuICAgIC8qKlxyXG4gICAgICog6L+Z5Liq5pyN5Yqh5piv5YGl5bq355qE77yM5Y+v5Lul5L2/55SoXHJcbiAgICAgKi9cclxuICAgIHN1Y2Nlc3MsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDov5nkuKrmnI3liqHnjrDlnKjkuI3og73mraPluLjlt6XkvZzkuoZcclxuICAgICAqL1xyXG4gICAgdW5oZWFsdGh5XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDmiYDmnInmnI3liqHnmoTniLbnsbtcclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGFic3RyYWN0IGNsYXNzIFNlcnZpY2VNb2R1bGUgZXh0ZW5kcyBldmVudHMuRXZlbnRFbWl0dGVyIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOWQr+WKqOacjeWKoVxyXG4gICAgICogXHJcbiAgICAgKiBAYWJzdHJhY3RcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBcclxuICAgICAqIEBtZW1iZXJvZiBTZXJ2aWNlTW9kdWxlXHJcbiAgICAgKi9cclxuICAgIGFic3RyYWN0IG9uU3RhcnQoKTogUHJvbWlzZTx2b2lkPjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOiOt+WPluacjeWKoeeahOWQjeensO+8iOm7mOiupOaYr+exu+WQje+8iVxyXG4gICAgICogXHJcbiAgICAgKiBAcmVhZG9ubHlcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZU1vZHVsZVxyXG4gICAgICovXHJcbiAgICBnZXQgbmFtZSgpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlgZzmraLmnI3liqFcclxuICAgICAqIFxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59IFxyXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VNb2R1bGVcclxuICAgICAqL1xyXG4gICAgb25TdG9wKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOW9k+ivpeacjeWKoeWPkeeUn+W8guW4uOaXtu+8jOi/meS4quaWueazleS8muWcqOWFqOWxgOmUmeivr+WkhOeQhuaWueazlShTZXJ2aWNlc01hbmFnZXLnmoRvbkVycm9yKeS5i+WJjeiiq+iwg+eUqOOAglxyXG4gICAgICog5rOo5oSP6K+l5pa55rOV5Y+q5pyJ5b2T5pyN5Yqh5Zyo6L+Q6KGM6L+H56iL5Lit5Y+R55Sf6ZSZ6K+v5pe277yM6K+l5pa55rOV5omN5Lya6KKr6LCD55So44CC5ZCv5Yqo5oiW5YGc5q2i5pyN5Yqh6L+H56iL5Lit5Y+R55Sf55qE6ZSZ6K+v77yM5peg5rOV6KKr6K+l5pa55rOV5aSE55CG44CCXHJcbiAgICAgKiDov5Tlm55mYWxzZSAgICAgICDvvJrplJnor6/lsIbnu6fnu63kuqTnlLHlhajlsYDplJnor6/lpITnkIbmlrnms5XlpITnkIZcclxuICAgICAqIOi/lOWbnnRydWUgICAgICAgIO+8mumUmeivr+S4jeWGjeS6pOeUseWFqOWxgOmUmeivr+WkhOeQhuaWueazleWkhOeQhlxyXG4gICAgICog6L+U5ZueRXJyb3IgICAgICAg77ya5pu/5o2i6ZSZ6K+v55qE5YaF5a6577yM5bCG5paw55qERXJyb3LkuqTnlLHlhajlsYDplJnor6/lpITnkIbmlrnms5Xnu6fnu63lpITnkIZcclxuICAgICAqIOi/lOWbnidzdG9wJyAgICAgIO+8muWBnOatouaJgOacieacjeWKoeeahOi/kOihjOOAglxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBlcnIg5pyN5Yqh5Lqn55Sf55qE6ZSZ6K+vXHJcbiAgICAgKiBAcmV0dXJucyB7KEVycm9yIHwgYm9vbGVhbiB8IHN0cmluZyl9IFxyXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VNb2R1bGVcclxuICAgICAqL1xyXG4gICAgb25FcnJvcihlcnI6IEVycm9yKTogRXJyb3IgfCBib29sZWFuIHwgc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmo4Dmn6XlvZPliY3mnI3liqHlt6XkvZzmmK/lkKbmraPluLhcclxuICAgICAqIFxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8SGVhbHRoU3RhdHVzPn0gXHJcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZU1vZHVsZVxyXG4gICAgICovXHJcbiAgICBvbkhlYWx0aENoZWNraW5nKCk6IFByb21pc2U8SGVhbHRoU3RhdHVzPiB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShIZWFsdGhTdGF0dXMuc3VjY2Vzcyk7XHJcbiAgICB9XHJcbn0iXX0=
