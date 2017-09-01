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
        this.services = new Proxy({}, {
            get: (_, property) => {
                if (this._servicesManager != null) {
                    const rs = this._servicesManager.services.get(property);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VNb2R1bGUvU2VydmljZU1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUFrQztBQUtsQzs7R0FFRztBQUNILG1CQUFvQyxTQUFRLE1BQU0sQ0FBQyxZQUFZO0lBQS9EOztRQTBCSTs7V0FFRztRQUNNLGFBQVEsR0FBUSxJQUFJLEtBQUssQ0FBQyxFQUFFLEVBQUU7WUFDbkMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLFFBQWdCO2dCQUNyQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDaEMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3hELEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO3dCQUNuQixNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQztvQkFDdEIsQ0FBQztnQkFDTCxDQUFDO1lBQ0wsQ0FBQztTQUNKLENBQUMsQ0FBQztJQThDUCxDQUFDO0lBbEZHOzs7OztPQUtHO0lBQ0gsSUFBSSxJQUFJO1FBQ0osTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUFXLGVBQWU7UUFDdEIsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztJQUNqQyxDQUFDO0lBQ0QsSUFBVyxlQUFlLENBQUMsQ0FBa0I7UUFDekMsV0FBVztRQUNYLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxTQUFTLENBQUM7WUFDcEMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBMkJEOzs7OztPQUtHO0lBQ0gsTUFBTTtRQUNGLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7Ozs7Ozs7O09BVUc7SUFDSCxPQUFPLENBQUMsR0FBVTtRQUNkLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILGdCQUFnQjtRQUNaLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDN0IsQ0FBQztDQUNKO0FBcEZELHNDQW9GQyIsImZpbGUiOiJTZXJ2aWNlTW9kdWxlL1NlcnZpY2VNb2R1bGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XG5pbXBvcnQgeyBSZWdpc3RlcmVkU2VydmljZSB9IGZyb20gXCIuLi9SZWdpc3RlcmVkU2VydmljZS9SZWdpc3RlcmVkU2VydmljZVwiO1xuaW1wb3J0IHsgU2VydmljZXNNYW5hZ2VyIH0gZnJvbSBcIi4uL1NlcnZpY2VzTWFuYWdlci9TZXJ2aWNlc01hbmFnZXJcIjtcblxuXG4vKipcbiAqIOaJgOacieacjeWKoeeahOeItuexuyAgICBcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFNlcnZpY2VNb2R1bGUgZXh0ZW5kcyBldmVudHMuRXZlbnRFbWl0dGVyIHtcblxuICAgIC8qKlxuICAgICAqIOiOt+WPluacjeWKoeeahOWQjeensO+8iOm7mOiupOaYr+exu+WQje+8iVxuICAgICAqIFxuICAgICAqIEByZWFkb25seVxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlr7nkuo7mnI3liqHnrqHnkIblmajnmoTlvJXnlKjjgIIgICAgXG4gICAgICog5b2T5pyN5Yqh5rOo5YaM5LmL5ZCO77yM5pyN5Yqh566h55CG5Zmo5Lya6Ieq5Yqo5a+56K+l5bGe5oCn6L+b6KGM57uR5a6aXG4gICAgICovXG4gICAgcHVibGljIGdldCBzZXJ2aWNlc01hbmFnZXIoKTogU2VydmljZXNNYW5hZ2VyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlcnZpY2VzTWFuYWdlcjtcbiAgICB9XG4gICAgcHVibGljIHNldCBzZXJ2aWNlc01hbmFnZXIodjogU2VydmljZXNNYW5hZ2VyKSB7XG4gICAgICAgIC8v56Gu5L+d5Y+q6IO96KKr6K6+572u5LiA5qyhXG4gICAgICAgIGlmICh0aGlzLl9zZXJ2aWNlc01hbmFnZXIgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHRoaXMuX3NlcnZpY2VzTWFuYWdlciA9IHY7XG4gICAgfVxuICAgIHByaXZhdGUgX3NlcnZpY2VzTWFuYWdlcjogU2VydmljZXNNYW5hZ2VyO1xuXG4gICAgLyoqXG4gICAgICog566A5YyW5a+55YW25LuW5rOo5YaM5pyN5Yqh55qE6I635Y+WXG4gICAgICovXG4gICAgcmVhZG9ubHkgc2VydmljZXM6IGFueSA9IG5ldyBQcm94eSh7fSwge1xuICAgICAgICBnZXQ6IChfLCBwcm9wZXJ0eTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fc2VydmljZXNNYW5hZ2VyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBycyA9IHRoaXMuX3NlcnZpY2VzTWFuYWdlci5zZXJ2aWNlcy5nZXQocHJvcGVydHkpO1xuICAgICAgICAgICAgICAgIGlmIChycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBycy5zZXJ2aWNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICog5ZCv5Yqo5pyN5YqhXG4gICAgICog5rOo5oSP77ya5ZCv5Yqo6L+H56iL5Lit5Ye6546w55qE6ZSZ6K+v55u05o6l6YCa6L+HcmVqZWN0KCnmnaXlpITnkIbjgIJcbiAgICAgKiDlkK/liqjkuYvlkI4o6L+Q6KGM6L+H56iL5LitKeWHuueOsOeahOmUmeivr++8jOmAmui/h3RoaXMuZW1pdCgnZXJyb3InKeadpeWkhOeQhuOAglxuICAgICAqIFxuICAgICAqIEBhYnN0cmFjdFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBcbiAgICAgKi9cbiAgICBhYnN0cmFjdCBvblN0YXJ0KCk6IFByb21pc2U8dm9pZD47XG5cbiAgICAvKipcbiAgICAgKiDlgZzmraLmnI3liqFcbiAgICAgKiDms6jmhI/vvJrlgZzmraLov4fnqIvkuK3lh7rnjrDnmoTplJnor6/nm7TmjqXpgJrov4dyZWplY3QoKeadpeWkhOeQhuOAglxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBcbiAgICAgKi9cbiAgICBvblN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlvZPor6XmnI3liqHlj5HnlJ/lvILluLjml7bvvIzov5nkuKrmlrnms5XkvJrlnKjlhajlsYDplJnor6/lpITnkIbmlrnms5UoU2VydmljZXNNYW5hZ2Vy55qEb25FcnJvcinkuYvliY3ooqvosIPnlKjjgIIgICAgXG4gICAgICog5rOo5oSP77ya6K+l5pa55rOV5Y+q5pyJ5b2T5pyN5Yqh5Zyo6L+Q6KGM6L+H56iL5Lit5Y+R55Sf6ZSZ6K+v5pe277yI6YCa6L+HdGhpcy5lbWl0KCdlcnJvcicp6Kem5Y+R55qE6ZSZ6K+v77yJ77yM6K+l5pa55rOV5omN5Lya6KKr6LCD55So44CCXG4gICAgICog5rOo5oSP77yab25FcnJvcuS4reeahOS7o+eggeS4jeW6lOWHuueOsOmUmeivr++8jOWmguaenG9uRXJyb3LnmoTkuK3nmoTku6PnoIHlh7rnjrDplJnor6/lsIbnm7TmjqXlr7zoh7TnqIvluo/lhbPpl63jgIJcbiAgICAgKiBcbiAgICAgKiDov5Tlm55mYWxzZSAgICAgICDvvJrplJnor6/lsIbnu6fnu63kuqTnlLHlhajlsYDplJnor6/lpITnkIbmlrnms5XlpITnkIYgICBcbiAgICAgKiDov5Tlm550cnVlICAgICAgICDvvJrplJnor6/kuI3lho3kuqTnlLHlhajlsYDplJnor6/lpITnkIbmlrnms5XlpITnkIYgICBcbiAgICAgKiDov5Tlm55FcnJvciAgICAgICDvvJrmm7/mjaLplJnor6/nmoTlhoXlrrnvvIzlsIbmlrDnmoRFcnJvcuS6pOeUseWFqOWxgOmUmeivr+WkhOeQhuaWueazlee7p+e7reWkhOeQhiAgIFxuICAgICAqIFxuICAgICAqIEBwYXJhbSBlcnIg6Kem5Y+R55qE6ZSZ6K+v5a+56LGhXG4gICAgICovXG4gICAgb25FcnJvcihlcnI6IEVycm9yKTogUHJvbWlzZTxFcnJvciB8IGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qOA5p+l5b2T5YmN5pyN5Yqh5bel5L2c5piv5ZCm5q2j5bi444CCICAgXG4gICAgICog5aaC5p6c5q2j5bi455u05o6lcmVzb2x2ZSgp77yM5aaC5p6c5Ye6546w6Zeu6aKY55u05o6lXCJyZWplY3QobmV3IEVycm9yKCkpXG4gICAgICogXG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59IFxuICAgICAqL1xuICAgIG9uSGVhbHRoQ2hlY2tpbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG59Il19
