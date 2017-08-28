"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events = require("events");
const HealthStatus_1 = require("./HealthStatus");
/**
 * 所有服务的父类
 * 注意：onStart()和onStop()发生的错误，直接通过在promise中抛出错误来解决。启动之后在运行过程中出现的错误，通过this.emit('error')来处理。
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VNb2R1bGUvU2VydmljZU1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUFrQztBQUNsQyxpREFBOEM7QUFHOUM7OztHQUdHO0FBQ0gsbUJBQW9DLFNBQVEsTUFBTSxDQUFDLFlBQVk7SUFFM0Q7Ozs7O09BS0c7SUFDSCxJQUFJLElBQUk7UUFDSixNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7SUFDakMsQ0FBQztJQVVEOzs7O09BSUc7SUFDSCxNQUFNO1FBQ0YsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNILE9BQU8sQ0FBQyxHQUFVO1FBQ2QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxnQkFBZ0I7UUFDWixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQywyQkFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pELENBQUM7Q0FDSjtBQXBERCxzQ0FvREMiLCJmaWxlIjoiU2VydmljZU1vZHVsZS9TZXJ2aWNlTW9kdWxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuaW1wb3J0IHsgSGVhbHRoU3RhdHVzIH0gZnJvbSBcIi4vSGVhbHRoU3RhdHVzXCI7XG5cblxuLyoqXG4gKiDmiYDmnInmnI3liqHnmoTniLbnsbsgICAgXG4gKiDms6jmhI/vvJpvblN0YXJ0KCnlkoxvblN0b3AoKeWPkeeUn+eahOmUmeivr++8jOebtOaOpemAmui/h+WcqHByb21pc2XkuK3mipvlh7rplJnor6/mnaXop6PlhrPjgILlkK/liqjkuYvlkI7lnKjov5DooYzov4fnqIvkuK3lh7rnjrDnmoTplJnor6/vvIzpgJrov4d0aGlzLmVtaXQoJ2Vycm9yJynmnaXlpITnkIbjgIJcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFNlcnZpY2VNb2R1bGUgZXh0ZW5kcyBldmVudHMuRXZlbnRFbWl0dGVyIHtcblxuICAgIC8qKlxuICAgICAqIOiOt+WPluacjeWKoeeahOWQjeensO+8iOm7mOiupOaYr+exu+WQje+8iVxuICAgICAqIFxuICAgICAqIEByZWFkb25seVxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlkK/liqjmnI3liqFcbiAgICAgKiBcbiAgICAgKiBAYWJzdHJhY3RcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gXG4gICAgICovXG4gICAgYWJzdHJhY3Qgb25TdGFydCgpOiBQcm9taXNlPHZvaWQ+O1xuXG4gICAgLyoqXG4gICAgICog5YGc5q2i5pyN5YqhXG4gICAgICogXG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59IFxuICAgICAqL1xuICAgIG9uU3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOW9k+ivpeacjeWKoeWPkeeUn+W8guW4uOaXtu+8jOi/meS4quaWueazleS8muWcqOWFqOWxgOmUmeivr+WkhOeQhuaWueazlShTZXJ2aWNlc01hbmFnZXLnmoRvbkVycm9yKeS5i+WJjeiiq+iwg+eUqOOAgiAgICBcbiAgICAgKiDms6jmhI/or6Xmlrnms5Xlj6rmnInlvZPmnI3liqHlnKjov5DooYzov4fnqIvkuK3lj5HnlJ/plJnor6/ml7bvvIjpgJrov4d0aGlzLmVtaXQoJ2Vycm9yJynop6blj5HnmoTplJnor6/vvInvvIzor6Xmlrnms5XmiY3kvJrooqvosIPnlKjjgIJcbiAgICAgKiBcbiAgICAgKiDov5Tlm55mYWxzZSAgICAgICDvvJrplJnor6/lsIbnu6fnu63kuqTnlLHlhajlsYDplJnor6/lpITnkIbmlrnms5XlpITnkIYgICBcbiAgICAgKiDov5Tlm550cnVlICAgICAgICDvvJrplJnor6/kuI3lho3kuqTnlLHlhajlsYDplJnor6/lpITnkIbmlrnms5XlpITnkIYgICBcbiAgICAgKiDov5Tlm55FcnJvciAgICAgICDvvJrmm7/mjaLplJnor6/nmoTlhoXlrrnvvIzlsIbmlrDnmoRFcnJvcuS6pOeUseWFqOWxgOmUmeivr+WkhOeQhuaWueazlee7p+e7reWkhOeQhiAgIFxuICAgICAqIOi/lOWbnidzdG9wJyAgICAgIO+8muWBnOatouaJgOacieacjeWKoeeahOi/kOihjOOAgiAgIFxuICAgICAqIFxuICAgICAqIEBwYXJhbSBlcnIg6Kem5Y+R55qE6ZSZ6K+v5a+56LGhXG4gICAgICovXG4gICAgb25FcnJvcihlcnI6IEVycm9yKTogUHJvbWlzZTxFcnJvciB8IGJvb2xlYW4gfCBzdHJpbmc+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qOA5p+l5b2T5YmN5pyN5Yqh5bel5L2c5piv5ZCm5q2j5bi4XG4gICAgICogXG4gICAgICogQHJldHVybnMge1Byb21pc2U8SGVhbHRoU3RhdHVzPn0gXG4gICAgICovXG4gICAgb25IZWFsdGhDaGVja2luZygpOiBQcm9taXNlPEhlYWx0aFN0YXR1cz4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKEhlYWx0aFN0YXR1cy5zdWNjZXNzKTtcbiAgICB9XG59Il19
