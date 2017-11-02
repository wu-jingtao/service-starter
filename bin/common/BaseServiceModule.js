"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RunningStatus_1 = require("./RunningStatus");
const Emitter = require("component-emitter");
/**
 * 所有服务模块的父类
 */
class BaseServiceModule extends Emitter {
    constructor() {
        super(...arguments);
        this._runningStatus = RunningStatus_1.RunningStatus.stopped;
        /**
         * 简化对其他注册服务的获取
         */
        this.services = new Proxy({}, {
            get: (_, property) => {
                if (this._servicesManager !== undefined) {
                    const rs = this._servicesManager.services.get(property);
                    if (rs !== undefined)
                        return rs.service;
                }
            }
        });
    }
    /**
     * 获取当前服务的名称（默认是类名）
     */
    get name() {
        return this.constructor.name;
    }
    /**
     * 当前模块的运行状态
     */
    get runningStatus() {
        return this._runningStatus;
    }
    set runningStatus(v) {
        this._runningStatus = v;
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
        else
            throw new Error(`模块：${this.name}：不允许重复设置ServicesManager`);
    }
    /**
     * 停止服务
     * 注意：停止过程中出现的错误直接通过Promise.reject()来处理。停止过程中不要出现未捕获异常
     *
     * @returns {Promise<void>}
     */
    onStop() {
        return Promise.resolve();
    }
    /**
     * 当服务发生异常时，这个方法会在全局错误处理方法(BaseServicesManager的onError)之前被调用。
     * 注意：该方法只有当服务在运行过程中发生错误时（通过this.emit('error')触发的错误），该方法才会被调用。
     *
     * 返回false、undefined或null                     ：错误将继续交由全局错误处理方法处理
     * 返回true                                       ：错误不再交由全局错误处理方法处理
     * 返回{errName: string | undefined, err: Error}  ：替换错误的内容，将新的Error交由全局错误处理方法继续处理
     *
     * @param errName 错误消息的名称
     * @param err 错误消息
     */
    onError(errName, err) {
        return Promise.resolve();
    }
    /**
     * 检查当前服务运行是否正常。
     * 如果正常直接Promise.resolve()，如果出现问题直接Promise.reject(new Error())
     *
     * @returns {Promise<void>}
     */
    onHealthCheck() {
        return Promise.resolve();
    }
    on(event, listener) {
        super.on(event, listener);
        return this;
    }
    once(event, listener) {
        super.once(event, listener);
        return this;
    }
    emit(event, ...args) {
        if (event === 'error') {
            let errName, err;
            if (args[0] instanceof Error) {
                err = args[0];
            }
            else {
                errName = args[0];
                err = args[1];
            }
            return super.emit(event, errName, err);
        }
        else {
            return super.emit(event, ...args);
        }
    }
}
exports.BaseServiceModule = BaseServiceModule;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9CYXNlU2VydmljZU1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLG1EQUFnRDtBQUNoRCw2Q0FBNkM7QUFFN0M7O0dBRUc7QUFDSCx1QkFBd0MsU0FBUSxPQUFPO0lBQXZEOztRQWtCWSxtQkFBYyxHQUFrQiw2QkFBYSxDQUFDLE9BQU8sQ0FBQztRQWtCOUQ7O1dBRUc7UUFDTSxhQUFRLEdBQVEsSUFBSSxLQUFLLENBQUMsRUFBRSxFQUFFO1lBQ25DLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxRQUFnQjtnQkFDckIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ3RDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUN4RCxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDO3dCQUNqQixNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQztnQkFDMUIsQ0FBQztZQUNMLENBQUM7U0FDSixDQUFDLENBQUM7SUFnR1AsQ0FBQztJQTdJRzs7T0FFRztJQUNILElBQUksSUFBSTtRQUNKLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztJQUNqQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLGFBQWE7UUFDYixNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQztJQUMvQixDQUFDO0lBQ0QsSUFBSSxhQUFhLENBQUMsQ0FBZ0I7UUFDOUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUdEOzs7T0FHRztJQUNILElBQUksZUFBZTtRQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7SUFDakMsQ0FBQztJQUNELElBQUksZUFBZSxDQUFDLENBQXNCO1FBQ3RDLFdBQVc7UUFDWCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEtBQUssU0FBUyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7UUFDOUIsSUFBSTtZQUNBLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSx5QkFBeUIsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUEyQkQ7Ozs7O09BS0c7SUFDSCxNQUFNO1FBQ0YsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNILE9BQU8sQ0FBQyxPQUEyQixFQUFFLEdBQVU7UUFDM0MsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxhQUFhO1FBQ1QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBTUQsRUFBRSxDQUFDLEtBQWEsRUFBRSxRQUFrQjtRQUNoQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFHRCxJQUFJLENBQUMsS0FBYSxFQUFFLFFBQWtCO1FBQ2xDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQXFCRCxJQUFJLENBQUMsS0FBYSxFQUFFLEdBQUcsSUFBVztRQUM5QixFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNwQixJQUFJLE9BQU8sRUFBRSxHQUFHLENBQUM7WUFDakIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQzNCLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEIsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEIsQ0FBQztZQUNELE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDdEMsQ0FBQztJQUNMLENBQUM7Q0FDSjtBQS9JRCw4Q0ErSUMiLCJmaWxlIjoiY29tbW9uL0Jhc2VTZXJ2aWNlTW9kdWxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmFzZVNlcnZpY2VzTWFuYWdlciB9IGZyb20gXCIuL0Jhc2VTZXJ2aWNlc01hbmFnZXJcIjtcclxuaW1wb3J0IHsgUnVubmluZ1N0YXR1cyB9IGZyb20gJy4vUnVubmluZ1N0YXR1cyc7XHJcbmltcG9ydCAqIGFzIEVtaXR0ZXIgZnJvbSAnY29tcG9uZW50LWVtaXR0ZXInO1xyXG5cclxuLyoqXHJcbiAqIOaJgOacieacjeWKoeaooeWdl+eahOeItuexuyAgICBcclxuICovXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlU2VydmljZU1vZHVsZSBleHRlbmRzIEVtaXR0ZXIge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog6I635Y+W5b2T5YmN5pyN5Yqh55qE5ZCN56ew77yI6buY6K6k5piv57G75ZCN77yJXHJcbiAgICAgKi9cclxuICAgIGdldCBuYW1lKCk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOW9k+WJjeaooeWdl+eahOi/kOihjOeKtuaAgVxyXG4gICAgICovXHJcbiAgICBnZXQgcnVubmluZ1N0YXR1cygpOiBSdW5uaW5nU3RhdHVzIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcnVubmluZ1N0YXR1cztcclxuICAgIH1cclxuICAgIHNldCBydW5uaW5nU3RhdHVzKHY6IFJ1bm5pbmdTdGF0dXMpIHtcclxuICAgICAgICB0aGlzLl9ydW5uaW5nU3RhdHVzID0gdjtcclxuICAgIH1cclxuICAgIHByaXZhdGUgX3J1bm5pbmdTdGF0dXM6IFJ1bm5pbmdTdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlr7nkuo7mnI3liqHnrqHnkIblmajnmoTlvJXnlKjjgIIgICAgXHJcbiAgICAgKiDlvZPmnI3liqHms6jlhozkuYvlkI7vvIzmnI3liqHnrqHnkIblmajkvJroh6rliqjlr7nor6XlsZ7mgKfov5vooYznu5HlrppcclxuICAgICAqL1xyXG4gICAgZ2V0IHNlcnZpY2VzTWFuYWdlcigpOiBCYXNlU2VydmljZXNNYW5hZ2VyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fc2VydmljZXNNYW5hZ2VyO1xyXG4gICAgfVxyXG4gICAgc2V0IHNlcnZpY2VzTWFuYWdlcih2OiBCYXNlU2VydmljZXNNYW5hZ2VyKSB7XHJcbiAgICAgICAgLy/noa7kv53lj6rog73ooqvorr7nva7kuIDmrKFcclxuICAgICAgICBpZiAodGhpcy5fc2VydmljZXNNYW5hZ2VyID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHRoaXMuX3NlcnZpY2VzTWFuYWdlciA9IHY7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOaooeWdl++8miR7dGhpcy5uYW1lfe+8muS4jeWFgeiuuOmHjeWkjeiuvue9rlNlcnZpY2VzTWFuYWdlcmApO1xyXG4gICAgfVxyXG4gICAgcHJpdmF0ZSBfc2VydmljZXNNYW5hZ2VyOiBCYXNlU2VydmljZXNNYW5hZ2VyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog566A5YyW5a+55YW25LuW5rOo5YaM5pyN5Yqh55qE6I635Y+WXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IHNlcnZpY2VzOiBhbnkgPSBuZXcgUHJveHkoe30sIHtcclxuICAgICAgICBnZXQ6IChfLCBwcm9wZXJ0eTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9zZXJ2aWNlc01hbmFnZXIgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcnMgPSB0aGlzLl9zZXJ2aWNlc01hbmFnZXIuc2VydmljZXMuZ2V0KHByb3BlcnR5KTtcclxuICAgICAgICAgICAgICAgIGlmIChycyAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBycy5zZXJ2aWNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlkK/liqjmnI3liqEgICAgIFxyXG4gICAgICog5rOo5oSP77ya5ZCv5Yqo6L+H56iL5Lit5Ye6546w55qE6ZSZ6K+v55u05o6l6YCa6L+HUHJvbWlzZS5yZWplY3QoKeadpeWkhOeQhuOAglxyXG4gICAgICog5ZCv5Yqo5LmL5ZCOKOi/kOihjOi/h+eoi+S4rSnlh7rnjrDnmoTplJnor6/vvIzpgJrov4d0aGlzLmVtaXQoJ2Vycm9yJynmnaXlpITnkIbjgIJcclxuICAgICAqIOWwveWPr+iDveWkmuWcsOaNleaNieW8guW4uO+8jOeEtuWQjuWcqG9uRXJyb3LkuK3lpITnkIbvvIzmnKrmjZXmjYnnmoTlvILluLjmoLnmja7lubPlj7DnmoTkuI3lkIzlj6/og73kvJrlr7zoh7TnqIvluo/nm7TmjqXooqvlhbPpl63jgIJcclxuICAgICAqIFxyXG4gICAgICogQGFic3RyYWN0XHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gXHJcbiAgICAgKi9cclxuICAgIGFic3RyYWN0IG9uU3RhcnQoKTogUHJvbWlzZTx2b2lkPjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOWBnOatouacjeWKoSAgICAgXHJcbiAgICAgKiDms6jmhI/vvJrlgZzmraLov4fnqIvkuK3lh7rnjrDnmoTplJnor6/nm7TmjqXpgJrov4dQcm9taXNlLnJlamVjdCgp5p2l5aSE55CG44CC5YGc5q2i6L+H56iL5Lit5LiN6KaB5Ye6546w5pyq5o2V6I635byC5bi4XHJcbiAgICAgKiBcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBcclxuICAgICAqL1xyXG4gICAgb25TdG9wKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOW9k+acjeWKoeWPkeeUn+W8guW4uOaXtu+8jOi/meS4quaWueazleS8muWcqOWFqOWxgOmUmeivr+WkhOeQhuaWueazlShCYXNlU2VydmljZXNNYW5hZ2Vy55qEb25FcnJvcinkuYvliY3ooqvosIPnlKjjgIIgICAgICBcclxuICAgICAqIOazqOaEj++8muivpeaWueazleWPquacieW9k+acjeWKoeWcqOi/kOihjOi/h+eoi+S4reWPkeeUn+mUmeivr+aXtu+8iOmAmui/h3RoaXMuZW1pdCgnZXJyb3InKeinpuWPkeeahOmUmeivr++8ie+8jOivpeaWueazleaJjeS8muiiq+iwg+eUqOOAgiAgICBcclxuICAgICAqIFxyXG4gICAgICog6L+U5ZueZmFsc2XjgIF1bmRlZmluZWTmiJZudWxsICAgICAgICAgICAgICAgICAgICAg77ya6ZSZ6K+v5bCG57un57ut5Lqk55Sx5YWo5bGA6ZSZ6K+v5aSE55CG5pa55rOV5aSE55CGICAgXHJcbiAgICAgKiDov5Tlm550cnVlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg77ya6ZSZ6K+v5LiN5YaN5Lqk55Sx5YWo5bGA6ZSZ6K+v5aSE55CG5pa55rOV5aSE55CGICAgXHJcbiAgICAgKiDov5Tlm557ZXJyTmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBlcnI6IEVycm9yfSAg77ya5pu/5o2i6ZSZ6K+v55qE5YaF5a6577yM5bCG5paw55qERXJyb3LkuqTnlLHlhajlsYDplJnor6/lpITnkIbmlrnms5Xnu6fnu63lpITnkIYgICBcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIGVyck5hbWUg6ZSZ6K+v5raI5oGv55qE5ZCN56ewXHJcbiAgICAgKiBAcGFyYW0gZXJyIOmUmeivr+a2iOaBr1xyXG4gICAgICovXHJcbiAgICBvbkVycm9yKGVyck5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZCwgZXJyOiBFcnJvcik6IFByb21pc2U8eyBlcnJOYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQsIGVycjogRXJyb3IgfSB8IGJvb2xlYW4gfCB2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5qOA5p+l5b2T5YmN5pyN5Yqh6L+Q6KGM5piv5ZCm5q2j5bi444CCICAgXHJcbiAgICAgKiDlpoLmnpzmraPluLjnm7TmjqVQcm9taXNlLnJlc29sdmUoKe+8jOWmguaenOWHuueOsOmXrumimOebtOaOpVByb21pc2UucmVqZWN0KG5ldyBFcnJvcigpKVxyXG4gICAgICogXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gXHJcbiAgICAgKi9cclxuICAgIG9uSGVhbHRoQ2hlY2soKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5qih5Z2X6L+Q6KGM6L+H56iL5Lit5Y+R55Sf55qE5LuO6ZSZ6K+vXHJcbiAgICAgKi9cclxuICAgIG9uKGV2ZW50OiAnZXJyb3InLCBsaXN0ZW5lcjogKGVyck5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZCwgZXJyOiBFcnJvcikgPT4gYW55KTogdGhpcztcclxuICAgIG9uKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHRoaXMge1xyXG4gICAgICAgIHN1cGVyLm9uKGV2ZW50LCBsaXN0ZW5lcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgb25jZShldmVudDogJ2Vycm9yJywgbGlzdGVuZXI6IChlcnJOYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQsIGVycjogRXJyb3IpID0+IGFueSk6IHRoaXM7XHJcbiAgICBvbmNlKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHRoaXMge1xyXG4gICAgICAgIHN1cGVyLm9uY2UoZXZlbnQsIGxpc3RlbmVyKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOinpuWPkemUmeivr+S6i+S7tuOAguW5tuiuvue9rumUmeivr+S6i+S7tueahGVyck5hbWXkuLp1bmRlZmluZWRcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHsnZXJyb3InfSBldmVudCBcclxuICAgICAqIEBwYXJhbSB7RXJyb3J9IGVyciDplJnor6/mtojmga9cclxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBcclxuICAgICAqIEBtZW1iZXJvZiBCYXNlU2VydmljZU1vZHVsZVxyXG4gICAgICovXHJcbiAgICBlbWl0KGV2ZW50OiAnZXJyb3InLCBlcnI6IEVycm9yKTogYm9vbGVhbjtcclxuICAgIC8qKlxyXG4gICAgICog6Kem5Y+R6ZSZ6K+v5LqL5Lu244CCXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7J2Vycm9yJ30gZXZlbnQgXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXJyTmFtZSDplJnor6/mtojmga/nmoTlkI3np7BcclxuICAgICAqIEBwYXJhbSB7RXJyb3J9IGVyciDplJnor6/mtojmga9cclxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBcclxuICAgICAqIEBtZW1iZXJvZiBCYXNlU2VydmljZU1vZHVsZVxyXG4gICAgICovXHJcbiAgICBlbWl0KGV2ZW50OiAnZXJyb3InLCBlcnJOYW1lOiBzdHJpbmcsIGVycjogRXJyb3IpOiBib29sZWFuO1xyXG4gICAgZW1pdChldmVudDogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGlmIChldmVudCA9PT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICBsZXQgZXJyTmFtZSwgZXJyO1xyXG4gICAgICAgICAgICBpZiAoYXJnc1swXSBpbnN0YW5jZW9mIEVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBlcnIgPSBhcmdzWzBdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZXJyTmFtZSA9IGFyZ3NbMF07XHJcbiAgICAgICAgICAgICAgICBlcnIgPSBhcmdzWzFdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBzdXBlci5lbWl0KGV2ZW50LCBlcnJOYW1lLCBlcnIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzdXBlci5lbWl0KGV2ZW50LCAuLi5hcmdzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iXX0=
