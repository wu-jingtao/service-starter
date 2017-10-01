"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RunningStatus_1 = require("./RunningStatus");
const log_formatter_1 = require("log-formatter");
/**
 * 对注册了的服务进行一层封装，便于ServicesManager使用。
 * 对于注册服务的生命周期进行管理。
 *
 * @class RegisteredService
 */
class RegisteredService {
    constructor(service, manager) {
        /**
         * 绑定在服务模块上的错误监听器。
         *
         * @type {Function}
         */
        this._errorListener = async (errName, err) => {
            const value = await this.service.onError(errName, err);
            switch (value) {
                case undefined:
                case null:
                case false:
                    this._manager.onError(errName, err, this.service);
                    break;
                case true:
                    break;
                default:
                    if (typeof value === 'object')
                        this._manager.onError(value.errName, value.err, this.service);
                    else
                        throw new Error(`[${this.service.name}] onError的返回值类型不满足要求。实际返回的类型为:${typeof value}`);
                    break;
            }
        };
        this.service = service;
        this._manager = manager;
        // 给服务绑定管理器
        this.service.servicesManager = manager;
    }
    /**
     * 启动服务。成功返回void，失败返回Error。
     * 如果抛出异常则一定是service-starter的逻辑错误
     * 这个方法仅供内部使用。
     *
     * @returns {Promise<Error | void>}
     */
    async start() {
        if (this.service.runningStatus !== RunningStatus_1.RunningStatus.stopped)
            throw new Error(`服务：${this.service.name}在未完全关闭的情况下又再次被启动。当前的状态为：${RunningStatus_1.RunningStatus[this.service.runningStatus]}`);
        try {
            log_formatter_1.default.location.title.blue(this.service.name, '开始启动');
            this.service.runningStatus = RunningStatus_1.RunningStatus.starting;
            this.service.on('error', this._errorListener);
            await this.service.onStart();
            log_formatter_1.default.location.title.green(this.service.name, '启动成功');
            this.service.runningStatus = RunningStatus_1.RunningStatus.running;
        }
        catch (err) {
            log_formatter_1.default.error
                .location.white
                .title.red
                .content.red(this.service.name, '启动失败', err);
            await this.stop();
            return err;
        }
    }
    /**
     * 停止服务。
     * 如果抛出异常则一定是service-starter的逻辑错误
     * 这个方法仅供内部使用。
     */
    async stop() {
        //确保不会重复停止
        if (this.service.runningStatus === RunningStatus_1.RunningStatus.stopping || this.service.runningStatus === RunningStatus_1.RunningStatus.stopped)
            throw new Error(`服务：${this.service.name}在处于正在停止或已停止的状态下又再次被停止。当前的状态为：${RunningStatus_1.RunningStatus[this.service.runningStatus]}`);
        try {
            log_formatter_1.default.location.title.blue(this.service.name, '开始停止');
            this.service.runningStatus = RunningStatus_1.RunningStatus.stopping;
            await this.service.onStop();
            log_formatter_1.default.location.title.green(this.service.name, '停止成功');
        }
        catch (err) {
            log_formatter_1.default.warn
                .location.white
                .title.yellow
                .content.yellow(this.service.name, '停止失败', err);
        }
        finally {
            this.service.runningStatus = RunningStatus_1.RunningStatus.stopped;
            this.service.off('error', this._errorListener);
        }
    }
    /**
     * 健康检查。
     * 如果抛出异常则一定是service-starter的逻辑错误
     * 这个方法仅供内部使用。
     *
     * @returns {(Promise<Error | void>)} 健康检查出现的错误
     */
    async healthCheck() {
        if (this.service.runningStatus !== RunningStatus_1.RunningStatus.running)
            throw new Error(`服务：${this.service.name}在非运行状态下进行了健康检查。当前的状态为：${RunningStatus_1.RunningStatus[this.service.runningStatus]}`);
        try {
            await this.service.onHealthCheck();
        }
        catch (err) {
            log_formatter_1.default.warn
                .location.white
                .title.yellow
                .content.yellow(`服务：${this.service.name}`, '运行状况异常：', err);
            return err;
        }
    }
}
exports.RegisteredService = RegisteredService;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9SZWdpc3RlcmVkU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLG1EQUFnRDtBQUNoRCxpREFBZ0M7QUFFaEM7Ozs7O0dBS0c7QUFDSDtJQXlDSSxZQUFZLE9BQTBCLEVBQUUsT0FBNEI7UUFsQ3BFOzs7O1dBSUc7UUFDYyxtQkFBYyxHQUFHLEtBQUssRUFBRSxPQUEyQixFQUFFLEdBQVU7WUFDNUUsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFdkQsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDWixLQUFLLFNBQVMsQ0FBQztnQkFDZixLQUFLLElBQUksQ0FBQztnQkFDVixLQUFLLEtBQUs7b0JBQ04sSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ2xELEtBQUssQ0FBQztnQkFFVixLQUFLLElBQUk7b0JBQ0wsS0FBSyxDQUFDO2dCQUVWO29CQUNJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQzt3QkFDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDbEUsSUFBSTt3QkFDQSxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLGlDQUFpQyxPQUFPLEtBQUssRUFBRSxDQUFDLENBQUM7b0JBQzFGLEtBQUssQ0FBQztZQUNkLENBQUM7UUFDTCxDQUFDLENBQUM7UUFVRSxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUV4QixXQUFXO1FB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QUFDLE9BQU8sQ0FBQyxhQUFhLEdBQUcsNkJBQWEsQ0FBQyxPQUFPLENBQUM7WUFDbkQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNuRCxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxXQUFXO1FBQ2IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEtBQUssNkJBQWEsQ0FBQyxPQUFPLENBQUM7WUFDckQsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSx5QkFBeUIsNkJBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUVqSCxJQUFJLENBQUM7WUFDRCxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDdkMsQ0FBQztRQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDWCx1QkFBRyxDQUFDLElBQUk7aUJBQ0gsUUFBUSxDQUFDLEtBQUs7aUJBQ2QsS0FBSyxDQUFDLE1BQU07aUJBQ1osT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQy9ELE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDZixDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBaklELDhDQWlJQyIsImZpbGUiOiJjb21tb24vUmVnaXN0ZXJlZFNlcnZpY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCYXNlU2VydmljZU1vZHVsZSB9IGZyb20gXCIuL0Jhc2VTZXJ2aWNlTW9kdWxlXCI7XHJcbmltcG9ydCB7IEJhc2VTZXJ2aWNlc01hbmFnZXIgfSBmcm9tIFwiLi9CYXNlU2VydmljZXNNYW5hZ2VyXCI7XHJcbmltcG9ydCB7IFJ1bm5pbmdTdGF0dXMgfSBmcm9tIFwiLi9SdW5uaW5nU3RhdHVzXCI7XHJcbmltcG9ydCBsb2cgZnJvbSAnbG9nLWZvcm1hdHRlcic7XHJcblxyXG4vKipcclxuICog5a+55rOo5YaM5LqG55qE5pyN5Yqh6L+b6KGM5LiA5bGC5bCB6KOF77yM5L6/5LqOU2VydmljZXNNYW5hZ2Vy5L2/55So44CCXHJcbiAqIOWvueS6juazqOWGjOacjeWKoeeahOeUn+WRveWRqOacn+i/m+ihjOeuoeeQhuOAglxyXG4gKiBcclxuICogQGNsYXNzIFJlZ2lzdGVyZWRTZXJ2aWNlXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgUmVnaXN0ZXJlZFNlcnZpY2Uge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog5L+d5a2Y5a+55pyN5Yqh566h55CG5Zmo55qE5byV55SoXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX21hbmFnZXI6IEJhc2VTZXJ2aWNlc01hbmFnZXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDnu5HlrprlnKjmnI3liqHmqKHlnZfkuIrnmoTplJnor6/nm5HlkKzlmajjgIJcclxuICAgICAqIFxyXG4gICAgICogQHR5cGUge0Z1bmN0aW9ufVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9lcnJvckxpc3RlbmVyID0gYXN5bmMgKGVyck5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZCwgZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgdGhpcy5zZXJ2aWNlLm9uRXJyb3IoZXJyTmFtZSwgZXJyKTtcclxuXHJcbiAgICAgICAgc3dpdGNoICh2YWx1ZSkge1xyXG4gICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcclxuICAgICAgICAgICAgY2FzZSBudWxsOlxyXG4gICAgICAgICAgICBjYXNlIGZhbHNlOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fbWFuYWdlci5vbkVycm9yKGVyck5hbWUsIGVyciwgdGhpcy5zZXJ2aWNlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSB0cnVlOlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFuYWdlci5vbkVycm9yKHZhbHVlLmVyck5hbWUsIHZhbHVlLmVyciwgdGhpcy5zZXJ2aWNlKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFske3RoaXMuc2VydmljZS5uYW1lfV0gb25FcnJvcueahOi/lOWbnuWAvOexu+Wei+S4jea7oei2s+imgeaxguOAguWunumZhei/lOWbnueahOexu+Wei+S4ujoke3R5cGVvZiB2YWx1ZX1gKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmnI3liqHlrp7kvotcclxuICAgICAqIFxyXG4gICAgICogQHR5cGUge1NlcnZpY2VNb2R1bGV9XHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IHNlcnZpY2U6IEJhc2VTZXJ2aWNlTW9kdWxlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHNlcnZpY2U6IEJhc2VTZXJ2aWNlTW9kdWxlLCBtYW5hZ2VyOiBCYXNlU2VydmljZXNNYW5hZ2VyKSB7XHJcbiAgICAgICAgdGhpcy5zZXJ2aWNlID0gc2VydmljZTtcclxuICAgICAgICB0aGlzLl9tYW5hZ2VyID0gbWFuYWdlcjtcclxuXHJcbiAgICAgICAgLy8g57uZ5pyN5Yqh57uR5a6a566h55CG5ZmoXHJcbiAgICAgICAgdGhpcy5zZXJ2aWNlLnNlcnZpY2VzTWFuYWdlciA9IG1hbmFnZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlkK/liqjmnI3liqHjgILmiJDlip/ov5Tlm552b2lk77yM5aSx6LSl6L+U5ZueRXJyb3LjgIIgICAgXHJcbiAgICAgKiDlpoLmnpzmipvlh7rlvILluLjliJnkuIDlrprmmK9zZXJ2aWNlLXN0YXJ0ZXLnmoTpgLvovpHplJnor68gICAgICBcclxuICAgICAqIOi/meS4quaWueazleS7heS+m+WGhemDqOS9v+eUqOOAglxyXG4gICAgICogXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxFcnJvciB8IHZvaWQ+fSBcclxuICAgICAqL1xyXG4gICAgYXN5bmMgc3RhcnQoKTogUHJvbWlzZTxFcnJvciB8IHZvaWQ+IHtcclxuICAgICAgICBpZiAodGhpcy5zZXJ2aWNlLnJ1bm5pbmdTdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMuc3RvcHBlZCkgLy/noa7kv53lj6rmnInlnKhzdG9wcGVk55qE5oOF5Ya15LiL5omN6IO95omn6KGMX3N0YXJ0XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5pyN5Yqh77yaJHt0aGlzLnNlcnZpY2UubmFtZX3lnKjmnKrlrozlhajlhbPpl63nmoTmg4XlhrXkuIvlj4jlho3mrKHooqvlkK/liqjjgILlvZPliY3nmoTnirbmgIHkuLrvvJoke1J1bm5pbmdTdGF0dXNbdGhpcy5zZXJ2aWNlLnJ1bm5pbmdTdGF0dXNdfWApO1xyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsb2cubG9jYXRpb24udGl0bGUuYmx1ZSh0aGlzLnNlcnZpY2UubmFtZSwgJ+W8gOWni+WQr+WKqCcpO1xyXG4gICAgICAgICAgICB0aGlzLnNlcnZpY2UucnVubmluZ1N0YXR1cyA9IFJ1bm5pbmdTdGF0dXMuc3RhcnRpbmc7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlcnZpY2Uub24oJ2Vycm9yJywgdGhpcy5fZXJyb3JMaXN0ZW5lcik7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2VydmljZS5vblN0YXJ0KCk7XHJcblxyXG4gICAgICAgICAgICBsb2cubG9jYXRpb24udGl0bGUuZ3JlZW4odGhpcy5zZXJ2aWNlLm5hbWUsICflkK/liqjmiJDlip8nKTtcclxuICAgICAgICAgICAgdGhpcy5zZXJ2aWNlLnJ1bm5pbmdTdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnJ1bm5pbmc7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGxvZy5lcnJvclxyXG4gICAgICAgICAgICAgICAgLmxvY2F0aW9uLndoaXRlXHJcbiAgICAgICAgICAgICAgICAudGl0bGUucmVkXHJcbiAgICAgICAgICAgICAgICAuY29udGVudC5yZWQodGhpcy5zZXJ2aWNlLm5hbWUsICflkK/liqjlpLHotKUnLCBlcnIpO1xyXG5cclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9wKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5YGc5q2i5pyN5Yqh44CCICAgIFxyXG4gICAgICog5aaC5p6c5oqb5Ye65byC5bi45YiZ5LiA5a6a5pivc2VydmljZS1zdGFydGVy55qE6YC76L6R6ZSZ6K+vICAgICAgXHJcbiAgICAgKiDov5nkuKrmlrnms5Xku4XkvpvlhoXpg6jkvb/nlKjjgIJcclxuICAgICAqL1xyXG4gICAgYXN5bmMgc3RvcCgpIHtcclxuICAgICAgICAvL+ehruS/neS4jeS8mumHjeWkjeWBnOatolxyXG4gICAgICAgIGlmICh0aGlzLnNlcnZpY2UucnVubmluZ1N0YXR1cyA9PT0gUnVubmluZ1N0YXR1cy5zdG9wcGluZyB8fCB0aGlzLnNlcnZpY2UucnVubmluZ1N0YXR1cyA9PT0gUnVubmluZ1N0YXR1cy5zdG9wcGVkKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOacjeWKoe+8miR7dGhpcy5zZXJ2aWNlLm5hbWV95Zyo5aSE5LqO5q2j5Zyo5YGc5q2i5oiW5bey5YGc5q2i55qE54q25oCB5LiL5Y+I5YaN5qyh6KKr5YGc5q2i44CC5b2T5YmN55qE54q25oCB5Li677yaJHtSdW5uaW5nU3RhdHVzW3RoaXMuc2VydmljZS5ydW5uaW5nU3RhdHVzXX1gKTtcclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbG9nLmxvY2F0aW9uLnRpdGxlLmJsdWUodGhpcy5zZXJ2aWNlLm5hbWUsICflvIDlp4vlgZzmraInKTtcclxuICAgICAgICAgICAgdGhpcy5zZXJ2aWNlLnJ1bm5pbmdTdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0b3BwaW5nO1xyXG5cclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXJ2aWNlLm9uU3RvcCgpO1xyXG5cclxuICAgICAgICAgICAgbG9nLmxvY2F0aW9uLnRpdGxlLmdyZWVuKHRoaXMuc2VydmljZS5uYW1lLCAn5YGc5q2i5oiQ5YqfJyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGxvZy53YXJuXHJcbiAgICAgICAgICAgICAgICAubG9jYXRpb24ud2hpdGVcclxuICAgICAgICAgICAgICAgIC50aXRsZS55ZWxsb3dcclxuICAgICAgICAgICAgICAgIC5jb250ZW50LnllbGxvdyh0aGlzLnNlcnZpY2UubmFtZSwgJ+WBnOatouWksei0pScsIGVycik7XHJcbiAgICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICAgICAgdGhpcy5zZXJ2aWNlLnJ1bm5pbmdTdGF0dXMgPSBSdW5uaW5nU3RhdHVzLnN0b3BwZWQ7XHJcbiAgICAgICAgICAgIHRoaXMuc2VydmljZS5vZmYoJ2Vycm9yJywgdGhpcy5fZXJyb3JMaXN0ZW5lcik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5YGl5bq35qOA5p+l44CCXHJcbiAgICAgKiDlpoLmnpzmipvlh7rlvILluLjliJnkuIDlrprmmK9zZXJ2aWNlLXN0YXJ0ZXLnmoTpgLvovpHplJnor68gICAgICAgXHJcbiAgICAgKiDov5nkuKrmlrnms5Xku4XkvpvlhoXpg6jkvb/nlKjjgIJcclxuICAgICAqIFxyXG4gICAgICogQHJldHVybnMgeyhQcm9taXNlPEVycm9yIHwgdm9pZD4pfSDlgaXlurfmo4Dmn6Xlh7rnjrDnmoTplJnor69cclxuICAgICAqL1xyXG4gICAgYXN5bmMgaGVhbHRoQ2hlY2soKTogUHJvbWlzZTxFcnJvciB8IHZvaWQ+IHtcclxuICAgICAgICBpZiAodGhpcy5zZXJ2aWNlLnJ1bm5pbmdTdGF0dXMgIT09IFJ1bm5pbmdTdGF0dXMucnVubmluZykgLy8g56Gu5L+d5Y+q5qOA5p+l6L+Q6KGM54q25Ya15LiL55qE5YGl5bq354q25oCBXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5pyN5Yqh77yaJHt0aGlzLnNlcnZpY2UubmFtZX3lnKjpnZ7ov5DooYznirbmgIHkuIvov5vooYzkuoblgaXlurfmo4Dmn6XjgILlvZPliY3nmoTnirbmgIHkuLrvvJoke1J1bm5pbmdTdGF0dXNbdGhpcy5zZXJ2aWNlLnJ1bm5pbmdTdGF0dXNdfWApO1xyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNlcnZpY2Uub25IZWFsdGhDaGVjaygpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBsb2cud2FyblxyXG4gICAgICAgICAgICAgICAgLmxvY2F0aW9uLndoaXRlXHJcbiAgICAgICAgICAgICAgICAudGl0bGUueWVsbG93XHJcbiAgICAgICAgICAgICAgICAuY29udGVudC55ZWxsb3coYOacjeWKoe+8miR7dGhpcy5zZXJ2aWNlLm5hbWV9YCwgJ+i/kOihjOeKtuWGteW8guW4uO+8micsIGVycik7XHJcbiAgICAgICAgICAgIHJldHVybiBlcnI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59Il19
