"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Emitter = require("component-emitter");
/**
 * 所有服务模块的父类
 */
class BaseServiceModule extends Emitter {
    constructor() {
        super(...arguments);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9CYXNlU2VydmljZU1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLDZDQUE2QztBQUU3Qzs7R0FFRztBQUNILHVCQUF3QyxTQUFRLE9BQU87SUFBdkQ7O1FBb0NJOztXQUVHO1FBQ00sYUFBUSxHQUFRLElBQUksS0FBSyxDQUFDLEVBQUUsRUFBRTtZQUNuQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBZ0I7Z0JBQ3JCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUN0QyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDeEQsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLFNBQVMsQ0FBQzt3QkFDakIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUM7Z0JBQzFCLENBQUM7WUFDTCxDQUFDO1NBQ0osQ0FBQyxDQUFDO0lBZ0dQLENBQUM7SUE3SUc7O09BRUc7SUFDSCxJQUFJLElBQUk7UUFDSixNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7SUFDakMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxhQUFhO1FBQ2IsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUM7SUFDL0IsQ0FBQztJQUNELElBQUksYUFBYSxDQUFDLENBQWdCO1FBQzlCLElBQUksQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFHRDs7O09BR0c7SUFDSCxJQUFJLGVBQWU7UUFDZixNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDO0lBQ2pDLENBQUM7SUFDRCxJQUFJLGVBQWUsQ0FBQyxDQUFzQjtRQUN0QyxXQUFXO1FBQ1gsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixLQUFLLFNBQVMsQ0FBQztZQUNwQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLElBQUk7WUFDQSxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUkseUJBQXlCLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBMkJEOzs7OztPQUtHO0lBQ0gsTUFBTTtRQUNGLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7Ozs7Ozs7O09BVUc7SUFDSCxPQUFPLENBQUMsT0FBMkIsRUFBRSxHQUFVO1FBQzNDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsYUFBYTtRQUNULE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQU1ELEVBQUUsQ0FBQyxLQUFhLEVBQUUsUUFBa0I7UUFDaEMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBR0QsSUFBSSxDQUFDLEtBQWEsRUFBRSxRQUFrQjtRQUNsQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM1QixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFxQkQsSUFBSSxDQUFDLEtBQWEsRUFBRSxHQUFHLElBQVc7UUFDOUIsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDcEIsSUFBSSxPQUFPLEVBQUUsR0FBRyxDQUFDO1lBQ2pCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUMzQixHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNsQixHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNKLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ3RDLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUEvSUQsOENBK0lDIiwiZmlsZSI6ImNvbW1vbi9CYXNlU2VydmljZU1vZHVsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJhc2VTZXJ2aWNlc01hbmFnZXIgfSBmcm9tIFwiLi9CYXNlU2VydmljZXNNYW5hZ2VyXCI7XHJcbmltcG9ydCB7IFJ1bm5pbmdTdGF0dXMgfSBmcm9tICcuL1J1bm5pbmdTdGF0dXMnO1xyXG5pbXBvcnQgKiBhcyBFbWl0dGVyIGZyb20gJ2NvbXBvbmVudC1lbWl0dGVyJztcclxuXHJcbi8qKlxyXG4gKiDmiYDmnInmnI3liqHmqKHlnZfnmoTniLbnsbsgICAgXHJcbiAqL1xyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZVNlcnZpY2VNb2R1bGUgZXh0ZW5kcyBFbWl0dGVyIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOiOt+WPluW9k+WJjeacjeWKoeeahOWQjeensO+8iOm7mOiupOaYr+exu+WQje+8iVxyXG4gICAgICovXHJcbiAgICBnZXQgbmFtZSgpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlvZPliY3mqKHlnZfnmoTov5DooYznirbmgIFcclxuICAgICAqL1xyXG4gICAgZ2V0IHJ1bm5pbmdTdGF0dXMoKTogUnVubmluZ1N0YXR1cyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3J1bm5pbmdTdGF0dXM7XHJcbiAgICB9XHJcbiAgICBzZXQgcnVubmluZ1N0YXR1cyh2OiBSdW5uaW5nU3RhdHVzKSB7XHJcbiAgICAgICAgdGhpcy5fcnVubmluZ1N0YXR1cyA9IHY7XHJcbiAgICB9XHJcbiAgICBwcml2YXRlIF9ydW5uaW5nU3RhdHVzOiBSdW5uaW5nU3RhdHVzO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog5a+55LqO5pyN5Yqh566h55CG5Zmo55qE5byV55So44CCICAgIFxyXG4gICAgICog5b2T5pyN5Yqh5rOo5YaM5LmL5ZCO77yM5pyN5Yqh566h55CG5Zmo5Lya6Ieq5Yqo5a+56K+l5bGe5oCn6L+b6KGM57uR5a6aXHJcbiAgICAgKi9cclxuICAgIGdldCBzZXJ2aWNlc01hbmFnZXIoKTogQmFzZVNlcnZpY2VzTWFuYWdlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlcnZpY2VzTWFuYWdlcjtcclxuICAgIH1cclxuICAgIHNldCBzZXJ2aWNlc01hbmFnZXIodjogQmFzZVNlcnZpY2VzTWFuYWdlcikge1xyXG4gICAgICAgIC8v56Gu5L+d5Y+q6IO96KKr6K6+572u5LiA5qyhXHJcbiAgICAgICAgaWYgKHRoaXMuX3NlcnZpY2VzTWFuYWdlciA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICB0aGlzLl9zZXJ2aWNlc01hbmFnZXIgPSB2O1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDmqKHlnZfvvJoke3RoaXMubmFtZX3vvJrkuI3lhYHorrjph43lpI3orr7nva5TZXJ2aWNlc01hbmFnZXJgKTtcclxuICAgIH1cclxuICAgIHByaXZhdGUgX3NlcnZpY2VzTWFuYWdlcjogQmFzZVNlcnZpY2VzTWFuYWdlcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOeugOWMluWvueWFtuS7luazqOWGjOacjeWKoeeahOiOt+WPllxyXG4gICAgICovXHJcbiAgICByZWFkb25seSBzZXJ2aWNlczogYW55ID0gbmV3IFByb3h5KHt9LCB7XHJcbiAgICAgICAgZ2V0OiAoXywgcHJvcGVydHk6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fc2VydmljZXNNYW5hZ2VyICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJzID0gdGhpcy5fc2VydmljZXNNYW5hZ2VyLnNlcnZpY2VzLmdldChwcm9wZXJ0eSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocnMgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnMuc2VydmljZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog5ZCv5Yqo5pyN5YqhICAgICBcclxuICAgICAqIOazqOaEj++8muWQr+WKqOi/h+eoi+S4reWHuueOsOeahOmUmeivr+ebtOaOpemAmui/h1Byb21pc2UucmVqZWN0KCnmnaXlpITnkIbjgIJcclxuICAgICAqIOWQr+WKqOS5i+WQjijov5DooYzov4fnqIvkuK0p5Ye6546w55qE6ZSZ6K+v77yM6YCa6L+HdGhpcy5lbWl0KCdlcnJvcicp5p2l5aSE55CG44CCXHJcbiAgICAgKiDlsL3lj6/og73lpJrlnLDmjZXmjYnlvILluLjvvIznhLblkI7lnKhvbkVycm9y5Lit5aSE55CG77yM5pyq5o2V5o2J55qE5byC5bi45qC55o2u5bmz5Y+w55qE5LiN5ZCM5Y+v6IO95Lya5a+86Ie056iL5bqP55u05o6l6KKr5YWz6Zet44CCXHJcbiAgICAgKiBcclxuICAgICAqIEBhYnN0cmFjdFxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59IFxyXG4gICAgICovXHJcbiAgICBhYnN0cmFjdCBvblN0YXJ0KCk6IFByb21pc2U8dm9pZD47XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlgZzmraLmnI3liqEgICAgIFxyXG4gICAgICog5rOo5oSP77ya5YGc5q2i6L+H56iL5Lit5Ye6546w55qE6ZSZ6K+v55u05o6l6YCa6L+HUHJvbWlzZS5yZWplY3QoKeadpeWkhOeQhuOAguWBnOatoui/h+eoi+S4reS4jeimgeWHuueOsOacquaNleiOt+W8guW4uFxyXG4gICAgICogXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gXHJcbiAgICAgKi9cclxuICAgIG9uU3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlvZPmnI3liqHlj5HnlJ/lvILluLjml7bvvIzov5nkuKrmlrnms5XkvJrlnKjlhajlsYDplJnor6/lpITnkIbmlrnms5UoQmFzZVNlcnZpY2VzTWFuYWdlcueahG9uRXJyb3Ip5LmL5YmN6KKr6LCD55So44CCICAgICAgXHJcbiAgICAgKiDms6jmhI/vvJror6Xmlrnms5Xlj6rmnInlvZPmnI3liqHlnKjov5DooYzov4fnqIvkuK3lj5HnlJ/plJnor6/ml7bvvIjpgJrov4d0aGlzLmVtaXQoJ2Vycm9yJynop6blj5HnmoTplJnor6/vvInvvIzor6Xmlrnms5XmiY3kvJrooqvosIPnlKjjgIIgICAgXHJcbiAgICAgKiBcclxuICAgICAqIOi/lOWbnmZhbHNl44CBdW5kZWZpbmVk5oiWbnVsbCAgICAgICAgICAgICAgICAgICAgIO+8mumUmeivr+Wwhue7p+e7reS6pOeUseWFqOWxgOmUmeivr+WkhOeQhuaWueazleWkhOeQhiAgIFxyXG4gICAgICog6L+U5ZuedHJ1ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIO+8mumUmeivr+S4jeWGjeS6pOeUseWFqOWxgOmUmeivr+WkhOeQhuaWueazleWkhOeQhiAgIFxyXG4gICAgICog6L+U5Zuee2Vyck5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZCwgZXJyOiBFcnJvcn0gIO+8muabv+aNoumUmeivr+eahOWGheWuue+8jOWwhuaWsOeahEVycm9y5Lqk55Sx5YWo5bGA6ZSZ6K+v5aSE55CG5pa55rOV57un57ut5aSE55CGICAgXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSBlcnJOYW1lIOmUmeivr+a2iOaBr+eahOWQjeensFxyXG4gICAgICogQHBhcmFtIGVyciDplJnor6/mtojmga9cclxuICAgICAqL1xyXG4gICAgb25FcnJvcihlcnJOYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQsIGVycjogRXJyb3IpOiBQcm9taXNlPHsgZXJyTmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBlcnI6IEVycm9yIH0gfCBib29sZWFuIHwgdm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOajgOafpeW9k+WJjeacjeWKoei/kOihjOaYr+WQpuato+W4uOOAgiAgIFxyXG4gICAgICog5aaC5p6c5q2j5bi455u05o6lUHJvbWlzZS5yZXNvbHZlKCnvvIzlpoLmnpzlh7rnjrDpl67popjnm7TmjqVQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoKSlcclxuICAgICAqIFxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59IFxyXG4gICAgICovXHJcbiAgICBvbkhlYWx0aENoZWNrKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOaooeWdl+i/kOihjOi/h+eoi+S4reWPkeeUn+eahOS7jumUmeivr1xyXG4gICAgICovXHJcbiAgICBvbihldmVudDogJ2Vycm9yJywgbGlzdGVuZXI6IChlcnJOYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQsIGVycjogRXJyb3IpID0+IGFueSk6IHRoaXM7XHJcbiAgICBvbihldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogRnVuY3Rpb24pOiB0aGlzIHtcclxuICAgICAgICBzdXBlci5vbihldmVudCwgbGlzdGVuZXIpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIG9uY2UoZXZlbnQ6ICdlcnJvcicsIGxpc3RlbmVyOiAoZXJyTmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBlcnI6IEVycm9yKSA9PiBhbnkpOiB0aGlzO1xyXG4gICAgb25jZShldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogRnVuY3Rpb24pOiB0aGlzIHtcclxuICAgICAgICBzdXBlci5vbmNlKGV2ZW50LCBsaXN0ZW5lcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDop6blj5HplJnor6/kuovku7bjgILlubborr7nva7plJnor6/kuovku7bnmoRlcnJOYW1l5Li6dW5kZWZpbmVkXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7J2Vycm9yJ30gZXZlbnQgXHJcbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBlcnIg6ZSZ6K+v5raI5oGvXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gXHJcbiAgICAgKiBAbWVtYmVyb2YgQmFzZVNlcnZpY2VNb2R1bGVcclxuICAgICAqL1xyXG4gICAgZW1pdChldmVudDogJ2Vycm9yJywgZXJyOiBFcnJvcik6IGJvb2xlYW47XHJcbiAgICAvKipcclxuICAgICAqIOinpuWPkemUmeivr+S6i+S7tuOAglxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0geydlcnJvcid9IGV2ZW50IFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGVyck5hbWUg6ZSZ6K+v5raI5oGv55qE5ZCN56ewXHJcbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBlcnIg6ZSZ6K+v5raI5oGvXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gXHJcbiAgICAgKiBAbWVtYmVyb2YgQmFzZVNlcnZpY2VNb2R1bGVcclxuICAgICAqL1xyXG4gICAgZW1pdChldmVudDogJ2Vycm9yJywgZXJyTmFtZTogc3RyaW5nLCBlcnI6IEVycm9yKTogYm9vbGVhbjtcclxuICAgIGVtaXQoZXZlbnQ6IHN0cmluZywgLi4uYXJnczogYW55W10pOiBib29sZWFuIHtcclxuICAgICAgICBpZiAoZXZlbnQgPT09ICdlcnJvcicpIHtcclxuICAgICAgICAgICAgbGV0IGVyck5hbWUsIGVycjtcclxuICAgICAgICAgICAgaWYgKGFyZ3NbMF0gaW5zdGFuY2VvZiBFcnJvcikge1xyXG4gICAgICAgICAgICAgICAgZXJyID0gYXJnc1swXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVyck5hbWUgPSBhcmdzWzBdO1xyXG4gICAgICAgICAgICAgICAgZXJyID0gYXJnc1sxXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc3VwZXIuZW1pdChldmVudCwgZXJyTmFtZSwgZXJyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gc3VwZXIuZW1pdChldmVudCwgLi4uYXJncyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59Il19
