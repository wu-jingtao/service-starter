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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VNb2R1bGUvU2VydmljZU1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUFrQztBQUNsQyxpREFBOEM7QUFHOUM7OztHQUdHO0FBQ0gsbUJBQW9DLFNBQVEsTUFBTSxDQUFDLFlBQVk7SUFFM0Q7Ozs7O09BS0c7SUFDSCxJQUFJLElBQUk7UUFDSixNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7SUFDakMsQ0FBQztJQVVEOzs7O09BSUc7SUFDSCxNQUFNO1FBQ0YsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNILE9BQU8sQ0FBQyxHQUFVO1FBQ2QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxnQkFBZ0I7UUFDWixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQywyQkFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pELENBQUM7Q0FDSjtBQXBERCxzQ0FvREMiLCJmaWxlIjoiU2VydmljZU1vZHVsZS9TZXJ2aWNlTW9kdWxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xyXG5pbXBvcnQgeyBIZWFsdGhTdGF0dXMgfSBmcm9tIFwiLi9IZWFsdGhTdGF0dXNcIjtcclxuXHJcblxyXG4vKipcclxuICog5omA5pyJ5pyN5Yqh55qE54i257G7ICAgIFxyXG4gKiDms6jmhI/vvJpvblN0YXJ0KCnlkoxvblN0b3AoKeWPkeeUn+eahOmUmeivr++8jOebtOaOpemAmui/h+WcqHByb21pc2XkuK3mipvlh7rplJnor6/mnaXop6PlhrPjgILlkK/liqjkuYvlkI7lnKjov5DooYzov4fnqIvkuK3lh7rnjrDnmoTplJnor6/vvIzpgJrov4d0aGlzLmVtaXQoJ2Vycm9yJynmnaXlpITnkIbjgIJcclxuICovXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTZXJ2aWNlTW9kdWxlIGV4dGVuZHMgZXZlbnRzLkV2ZW50RW1pdHRlciB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDojrflj5bmnI3liqHnmoTlkI3np7DvvIjpu5jorqTmmK/nsbvlkI3vvIlcclxuICAgICAqIFxyXG4gICAgICogQHJlYWRvbmx5XHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBnZXQgbmFtZSgpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlkK/liqjmnI3liqFcclxuICAgICAqIFxyXG4gICAgICogQGFic3RyYWN0XHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gXHJcbiAgICAgKi9cclxuICAgIGFic3RyYWN0IG9uU3RhcnQoKTogUHJvbWlzZTx2b2lkPjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOWBnOatouacjeWKoVxyXG4gICAgICogXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gXHJcbiAgICAgKi9cclxuICAgIG9uU3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlvZPor6XmnI3liqHlj5HnlJ/lvILluLjml7bvvIzov5nkuKrmlrnms5XkvJrlnKjlhajlsYDplJnor6/lpITnkIbmlrnms5UoU2VydmljZXNNYW5hZ2Vy55qEb25FcnJvcinkuYvliY3ooqvosIPnlKjjgIIgICAgXHJcbiAgICAgKiDms6jmhI/or6Xmlrnms5Xlj6rmnInlvZPmnI3liqHlnKjov5DooYzov4fnqIvkuK3lj5HnlJ/plJnor6/ml7bvvIjpgJrov4d0aGlzLmVtaXQoJ2Vycm9yJynop6blj5HnmoTplJnor6/vvInvvIzor6Xmlrnms5XmiY3kvJrooqvosIPnlKjjgIJcclxuICAgICAqIFxyXG4gICAgICog6L+U5ZueZmFsc2UgICAgICAg77ya6ZSZ6K+v5bCG57un57ut5Lqk55Sx5YWo5bGA6ZSZ6K+v5aSE55CG5pa55rOV5aSE55CGICAgXHJcbiAgICAgKiDov5Tlm550cnVlICAgICAgICDvvJrplJnor6/kuI3lho3kuqTnlLHlhajlsYDplJnor6/lpITnkIbmlrnms5XlpITnkIYgICBcclxuICAgICAqIOi/lOWbnkVycm9yICAgICAgIO+8muabv+aNoumUmeivr+eahOWGheWuue+8jOWwhuaWsOeahEVycm9y5Lqk55Sx5YWo5bGA6ZSZ6K+v5aSE55CG5pa55rOV57un57ut5aSE55CGICAgXHJcbiAgICAgKiDov5Tlm54nc3RvcCcgICAgICDvvJrlgZzmraLmiYDmnInmnI3liqHnmoTov5DooYzjgIIgICBcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIGVyciDop6blj5HnmoTplJnor6/lr7nosaFcclxuICAgICAqL1xyXG4gICAgb25FcnJvcihlcnI6IEVycm9yKTogUHJvbWlzZTxFcnJvciB8IGJvb2xlYW4gfCBzdHJpbmc+IHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOajgOafpeW9k+WJjeacjeWKoeW3peS9nOaYr+WQpuato+W4uFxyXG4gICAgICogXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxIZWFsdGhTdGF0dXM+fSBcclxuICAgICAqL1xyXG4gICAgb25IZWFsdGhDaGVja2luZygpOiBQcm9taXNlPEhlYWx0aFN0YXR1cz4ge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoSGVhbHRoU3RhdHVzLnN1Y2Nlc3MpO1xyXG4gICAgfVxyXG59Il19
