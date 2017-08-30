"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events = require("events");
/**
 * 所有服务的父类
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VNb2R1bGUvU2VydmljZU1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUFrQztBQUtsQzs7R0FFRztBQUNILG1CQUFvQyxTQUFRLE1BQU0sQ0FBQyxZQUFZO0lBRTNEOzs7OztPQUtHO0lBQ0gsSUFBSSxJQUFJO1FBQ0osTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUFXLGVBQWU7UUFDdEIsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztJQUNqQyxDQUFDO0lBQ0QsSUFBVyxlQUFlLENBQUMsQ0FBa0I7UUFDekMsV0FBVztRQUNYLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxTQUFTLENBQUM7WUFDcEMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBYUQ7Ozs7O09BS0c7SUFDSCxNQUFNO1FBQ0YsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNILE9BQU8sQ0FBQyxHQUFVO1FBQ2QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsZ0JBQWdCO1FBQ1osTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM3QixDQUFDO0NBQ0o7QUF0RUQsc0NBc0VDIiwiZmlsZSI6IlNlcnZpY2VNb2R1bGUvU2VydmljZU1vZHVsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBldmVudHMgPSByZXF1aXJlKCdldmVudHMnKTtcbmltcG9ydCB7IFJlZ2lzdGVyZWRTZXJ2aWNlIH0gZnJvbSBcIi4uL1JlZ2lzdGVyZWRTZXJ2aWNlL1JlZ2lzdGVyZWRTZXJ2aWNlXCI7XG5pbXBvcnQgeyBTZXJ2aWNlc01hbmFnZXIgfSBmcm9tIFwiLi4vU2VydmljZXNNYW5hZ2VyL1NlcnZpY2VzTWFuYWdlclwiO1xuXG5cbi8qKlxuICog5omA5pyJ5pyN5Yqh55qE54i257G7ICAgIFxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU2VydmljZU1vZHVsZSBleHRlbmRzIGV2ZW50cy5FdmVudEVtaXR0ZXIge1xuXG4gICAgLyoqXG4gICAgICog6I635Y+W5pyN5Yqh55qE5ZCN56ew77yI6buY6K6k5piv57G75ZCN77yJXG4gICAgICogXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWvueS6juacjeWKoeeuoeeQhuWZqOeahOW8leeUqOOAgiAgICBcbiAgICAgKiDlvZPmnI3liqHms6jlhozkuYvlkI7vvIzmnI3liqHnrqHnkIblmajkvJroh6rliqjlr7nor6XlsZ7mgKfov5vooYznu5HlrppcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IHNlcnZpY2VzTWFuYWdlcigpOiBTZXJ2aWNlc01hbmFnZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2VydmljZXNNYW5hZ2VyO1xuICAgIH1cbiAgICBwdWJsaWMgc2V0IHNlcnZpY2VzTWFuYWdlcih2OiBTZXJ2aWNlc01hbmFnZXIpIHtcbiAgICAgICAgLy/noa7kv53lj6rog73ooqvorr7nva7kuIDmrKFcbiAgICAgICAgaWYgKHRoaXMuX3NlcnZpY2VzTWFuYWdlciA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgdGhpcy5fc2VydmljZXNNYW5hZ2VyID0gdjtcbiAgICB9XG4gICAgcHJpdmF0ZSBfc2VydmljZXNNYW5hZ2VyOiBTZXJ2aWNlc01hbmFnZXI7XG5cbiAgICAvKipcbiAgICAgKiDlkK/liqjmnI3liqFcbiAgICAgKiDms6jmhI/vvJrlkK/liqjov4fnqIvkuK3lh7rnjrDnmoTplJnor6/nm7TmjqXpgJrov4dyZWplY3QoKeadpeWkhOeQhuOAglxuICAgICAqIOWQr+WKqOS5i+WQjijov5DooYzov4fnqIvkuK0p5Ye6546w55qE6ZSZ6K+v77yM6YCa6L+HdGhpcy5lbWl0KCdlcnJvcicp5p2l5aSE55CG44CCXG4gICAgICogXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59IFxuICAgICAqL1xuICAgIGFic3RyYWN0IG9uU3RhcnQoKTogUHJvbWlzZTx2b2lkPjtcblxuICAgIC8qKlxuICAgICAqIOWBnOatouacjeWKoVxuICAgICAqIOazqOaEj++8muWBnOatoui/h+eoi+S4reWHuueOsOeahOmUmeivr+ebtOaOpemAmui/h3JlamVjdCgp5p2l5aSE55CG44CCXG4gICAgICogXG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59IFxuICAgICAqL1xuICAgIG9uU3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOW9k+ivpeacjeWKoeWPkeeUn+W8guW4uOaXtu+8jOi/meS4quaWueazleS8muWcqOWFqOWxgOmUmeivr+WkhOeQhuaWueazlShTZXJ2aWNlc01hbmFnZXLnmoRvbkVycm9yKeS5i+WJjeiiq+iwg+eUqOOAgiAgICBcbiAgICAgKiDms6jmhI/vvJror6Xmlrnms5Xlj6rmnInlvZPmnI3liqHlnKjov5DooYzov4fnqIvkuK3lj5HnlJ/plJnor6/ml7bvvIjpgJrov4d0aGlzLmVtaXQoJ2Vycm9yJynop6blj5HnmoTplJnor6/vvInvvIzor6Xmlrnms5XmiY3kvJrooqvosIPnlKjjgIJcbiAgICAgKiDms6jmhI/vvJpvbkVycm9y5Lit55qE5Luj56CB5LiN5bqU5Ye6546w6ZSZ6K+v77yM5aaC5p6cb25FcnJvcueahOS4reeahOS7o+eggeWHuueOsOmUmeivr+WwhuebtOaOpeWvvOiHtOeoi+W6j+WFs+mXreOAglxuICAgICAqIFxuICAgICAqIOi/lOWbnmZhbHNlICAgICAgIO+8mumUmeivr+Wwhue7p+e7reS6pOeUseWFqOWxgOmUmeivr+WkhOeQhuaWueazleWkhOeQhiAgIFxuICAgICAqIOi/lOWbnnRydWUgICAgICAgIO+8mumUmeivr+S4jeWGjeS6pOeUseWFqOWxgOmUmeivr+WkhOeQhuaWueazleWkhOeQhiAgIFxuICAgICAqIOi/lOWbnkVycm9yICAgICAgIO+8muabv+aNoumUmeivr+eahOWGheWuue+8jOWwhuaWsOeahEVycm9y5Lqk55Sx5YWo5bGA6ZSZ6K+v5aSE55CG5pa55rOV57un57ut5aSE55CGICAgXG4gICAgICogXG4gICAgICogQHBhcmFtIGVyciDop6blj5HnmoTplJnor6/lr7nosaFcbiAgICAgKi9cbiAgICBvbkVycm9yKGVycjogRXJyb3IpOiBQcm9taXNlPEVycm9yIHwgYm9vbGVhbj4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmo4Dmn6XlvZPliY3mnI3liqHlt6XkvZzmmK/lkKbmraPluLjjgIIgICBcbiAgICAgKiDlpoLmnpzmraPluLjnm7TmjqVyZXNvbHZlKCnvvIzlpoLmnpzlh7rnjrDpl67popjnm7TmjqVcInJlamVjdChuZXcgRXJyb3IoKSlcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gXG4gICAgICovXG4gICAgb25IZWFsdGhDaGVja2luZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbn0iXX0=
