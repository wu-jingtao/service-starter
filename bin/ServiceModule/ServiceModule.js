"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events = require("events");
/**
 * 所有服务的父类
 */
class ServiceModule extends events.EventEmitter {
    constructor() {
        super(...arguments);
        /**
         * 简化对其他注册服务的获取
         */
        this.services = new Proxy(this, {
            get(target, property) {
                if (target._servicesManager != null) {
                    const rs = target._servicesManager.services.get(property);
                    if (rs !== undefined) {
                        return rs.service;
                    }
                }
            }
        });
    }
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
     * 对于服务管理器的引用。
     * 当服务注册之后，服务管理器会自动对该属性进行绑定
     */
    get servicesManager() {
        return this._servicesManager;
    }
    set servicesManager(v) {
        //确保只能被设置一次
        if (this._servicesManager === undefined)
            this._servicesManager = v;
    }
    /**
     * 停止服务
     * 注意：停止过程中出现的错误直接通过reject()来处理。
     *
     * @returns {Promise<void>}
     */
    onStop() {
        return Promise.resolve();
    }
    /**
     * 当该服务发生异常时，这个方法会在全局错误处理方法(ServicesManager的onError)之前被调用。
     * 注意：该方法只有当服务在运行过程中发生错误时（通过this.emit('error')触发的错误），该方法才会被调用。
     * 注意：onError中的代码不应出现错误，如果onError的中的代码出现错误将直接导致程序关闭。
     *
     * 返回false       ：错误将继续交由全局错误处理方法处理
     * 返回true        ：错误不再交由全局错误处理方法处理
     * 返回Error       ：替换错误的内容，将新的Error交由全局错误处理方法继续处理
     *
     * @param err 触发的错误对象
     */
    onError(err) {
        return Promise.resolve(false);
    }
    /**
     * 检查当前服务工作是否正常。
     * 如果正常直接resolve()，如果出现问题直接"reject(new Error())
     *
     * @returns {Promise<void>}
     */
    onHealthChecking() {
        return Promise.resolve();
    }
}
exports.ServiceModule = ServiceModule;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VNb2R1bGUvU2VydmljZU1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUFrQztBQUtsQzs7R0FFRztBQUNILG1CQUFvQyxTQUFRLE1BQU0sQ0FBQyxZQUFZO0lBQS9EOztRQTBCSTs7V0FFRztRQUNNLGFBQVEsR0FBUSxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUU7WUFDckMsR0FBRyxDQUFDLE1BQU0sRUFBRSxRQUFnQjtnQkFDeEIsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLGdCQUFnQixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUMxRCxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQzt3QkFDbkIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUM7b0JBQ3RCLENBQUM7Z0JBQ0wsQ0FBQztZQUNMLENBQUM7U0FDSixDQUFDLENBQUM7SUE4Q1AsQ0FBQztJQWxGRzs7Ozs7T0FLRztJQUNILElBQUksSUFBSTtRQUNKLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztJQUNqQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBVyxlQUFlO1FBQ3RCLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7SUFDakMsQ0FBQztJQUNELElBQVcsZUFBZSxDQUFDLENBQWtCO1FBQ3pDLFdBQVc7UUFDWCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEtBQUssU0FBUyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQTJCRDs7Ozs7T0FLRztJQUNILE1BQU07UUFDRixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzdCLENBQUM7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0gsT0FBTyxDQUFDLEdBQVU7UUFDZCxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxnQkFBZ0I7UUFDWixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzdCLENBQUM7Q0FDSjtBQXBGRCxzQ0FvRkMiLCJmaWxlIjoiU2VydmljZU1vZHVsZS9TZXJ2aWNlTW9kdWxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuaW1wb3J0IHsgUmVnaXN0ZXJlZFNlcnZpY2UgfSBmcm9tIFwiLi4vUmVnaXN0ZXJlZFNlcnZpY2UvUmVnaXN0ZXJlZFNlcnZpY2VcIjtcbmltcG9ydCB7IFNlcnZpY2VzTWFuYWdlciB9IGZyb20gXCIuLi9TZXJ2aWNlc01hbmFnZXIvU2VydmljZXNNYW5hZ2VyXCI7XG5cblxuLyoqXG4gKiDmiYDmnInmnI3liqHnmoTniLbnsbsgICAgXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTZXJ2aWNlTW9kdWxlIGV4dGVuZHMgZXZlbnRzLkV2ZW50RW1pdHRlciB7XG5cbiAgICAvKipcbiAgICAgKiDojrflj5bmnI3liqHnmoTlkI3np7DvvIjpu5jorqTmmK/nsbvlkI3vvIlcbiAgICAgKiBcbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5a+55LqO5pyN5Yqh566h55CG5Zmo55qE5byV55So44CCICAgIFxuICAgICAqIOW9k+acjeWKoeazqOWGjOS5i+WQju+8jOacjeWKoeeuoeeQhuWZqOS8muiHquWKqOWvueivpeWxnuaAp+i/m+ihjOe7keWumlxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgc2VydmljZXNNYW5hZ2VyKCk6IFNlcnZpY2VzTWFuYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZXJ2aWNlc01hbmFnZXI7XG4gICAgfVxuICAgIHB1YmxpYyBzZXQgc2VydmljZXNNYW5hZ2VyKHY6IFNlcnZpY2VzTWFuYWdlcikge1xuICAgICAgICAvL+ehruS/neWPquiDveiiq+iuvue9ruS4gOasoVxuICAgICAgICBpZiAodGhpcy5fc2VydmljZXNNYW5hZ2VyID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICB0aGlzLl9zZXJ2aWNlc01hbmFnZXIgPSB2O1xuICAgIH1cbiAgICBwcml2YXRlIF9zZXJ2aWNlc01hbmFnZXI6IFNlcnZpY2VzTWFuYWdlcjtcblxuICAgIC8qKlxuICAgICAqIOeugOWMluWvueWFtuS7luazqOWGjOacjeWKoeeahOiOt+WPllxuICAgICAqL1xuICAgIHJlYWRvbmx5IHNlcnZpY2VzOiBhbnkgPSBuZXcgUHJveHkodGhpcywge1xuICAgICAgICBnZXQodGFyZ2V0LCBwcm9wZXJ0eTogc3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAodGFyZ2V0Ll9zZXJ2aWNlc01hbmFnZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJzID0gdGFyZ2V0Ll9zZXJ2aWNlc01hbmFnZXIuc2VydmljZXMuZ2V0KHByb3BlcnR5KTtcbiAgICAgICAgICAgICAgICBpZiAocnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnMuc2VydmljZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIOWQr+WKqOacjeWKoVxuICAgICAqIOazqOaEj++8muWQr+WKqOi/h+eoi+S4reWHuueOsOeahOmUmeivr+ebtOaOpemAmui/h3JlamVjdCgp5p2l5aSE55CG44CCXG4gICAgICog5ZCv5Yqo5LmL5ZCOKOi/kOihjOi/h+eoi+S4rSnlh7rnjrDnmoTplJnor6/vvIzpgJrov4d0aGlzLmVtaXQoJ2Vycm9yJynmnaXlpITnkIbjgIJcbiAgICAgKiBcbiAgICAgKiBAYWJzdHJhY3RcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gXG4gICAgICovXG4gICAgYWJzdHJhY3Qgb25TdGFydCgpOiBQcm9taXNlPHZvaWQ+O1xuXG4gICAgLyoqXG4gICAgICog5YGc5q2i5pyN5YqhXG4gICAgICog5rOo5oSP77ya5YGc5q2i6L+H56iL5Lit5Ye6546w55qE6ZSZ6K+v55u05o6l6YCa6L+HcmVqZWN0KCnmnaXlpITnkIbjgIJcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gXG4gICAgICovXG4gICAgb25TdG9wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5b2T6K+l5pyN5Yqh5Y+R55Sf5byC5bi45pe277yM6L+Z5Liq5pa55rOV5Lya5Zyo5YWo5bGA6ZSZ6K+v5aSE55CG5pa55rOVKFNlcnZpY2VzTWFuYWdlcueahG9uRXJyb3Ip5LmL5YmN6KKr6LCD55So44CCICAgIFxuICAgICAqIOazqOaEj++8muivpeaWueazleWPquacieW9k+acjeWKoeWcqOi/kOihjOi/h+eoi+S4reWPkeeUn+mUmeivr+aXtu+8iOmAmui/h3RoaXMuZW1pdCgnZXJyb3InKeinpuWPkeeahOmUmeivr++8ie+8jOivpeaWueazleaJjeS8muiiq+iwg+eUqOOAglxuICAgICAqIOazqOaEj++8mm9uRXJyb3LkuK3nmoTku6PnoIHkuI3lupTlh7rnjrDplJnor6/vvIzlpoLmnpxvbkVycm9y55qE5Lit55qE5Luj56CB5Ye6546w6ZSZ6K+v5bCG55u05o6l5a+86Ie056iL5bqP5YWz6Zet44CCXG4gICAgICogXG4gICAgICog6L+U5ZueZmFsc2UgICAgICAg77ya6ZSZ6K+v5bCG57un57ut5Lqk55Sx5YWo5bGA6ZSZ6K+v5aSE55CG5pa55rOV5aSE55CGICAgXG4gICAgICog6L+U5ZuedHJ1ZSAgICAgICAg77ya6ZSZ6K+v5LiN5YaN5Lqk55Sx5YWo5bGA6ZSZ6K+v5aSE55CG5pa55rOV5aSE55CGICAgXG4gICAgICog6L+U5ZueRXJyb3IgICAgICAg77ya5pu/5o2i6ZSZ6K+v55qE5YaF5a6577yM5bCG5paw55qERXJyb3LkuqTnlLHlhajlsYDplJnor6/lpITnkIbmlrnms5Xnu6fnu63lpITnkIYgICBcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gZXJyIOinpuWPkeeahOmUmeivr+WvueixoVxuICAgICAqL1xuICAgIG9uRXJyb3IoZXJyOiBFcnJvcik6IFByb21pc2U8RXJyb3IgfCBib29sZWFuPiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOajgOafpeW9k+WJjeacjeWKoeW3peS9nOaYr+WQpuato+W4uOOAgiAgIFxuICAgICAqIOWmguaenOato+W4uOebtOaOpXJlc29sdmUoKe+8jOWmguaenOWHuueOsOmXrumimOebtOaOpVwicmVqZWN0KG5ldyBFcnJvcigpKVxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBcbiAgICAgKi9cbiAgICBvbkhlYWx0aENoZWNraW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxufSJdfQ==
