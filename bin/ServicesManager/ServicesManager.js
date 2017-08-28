"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events = require("events");
const http = require("http");
const fs = require("fs-extra");
const RegisteredService_1 = require("./RegisteredService");
const Log_1 = require("../Log");
const HealthStatus_1 = require("../ServiceModule/HealthStatus");
/**
 * 服务管理器
 *
 * @export
 * @class ServicesManager
 * @extends {events.EventEmitter}
 */
class ServicesManager extends events.EventEmitter {
    constructor(config = {}) {
        super();
        this._isStarted = false; //是否已经启动
        /**
         * 注册的服务列表。(服务只应当通过registerService来进行注册)
         */
        this._services = [];
        if (ServicesManager._servicesManagerCreated)
            throw new Error(`${this.name}已经被创建了`);
        ServicesManager._servicesManagerCreated = true;
        process.on('unhandledRejection', (err) => {
            Log_1.log.e('程序出现未捕捉Promise异常：', err);
            if (config.stopOnHaveUnhandledRejection !== false) {
                this.stop(1);
            }
        });
        process.on('uncaughtException', (err) => {
            Log_1.log.e('程序出现未捕捉异常：', err);
            if (config.stopOnHaveUncaughtException !== false) {
                this.stop(1);
            }
        });
        process.on('SIGTERM', () => {
            if (config.stopOnHaveSIGTERM !== false) {
                this.stop();
            }
        });
        process.on('SIGINT', () => {
            if (config.stopOnHaveSIGINT !== false) {
                this.stop();
            }
        });
        //配置健康检查服务
        if (config.startHealthChecking !== false) {
            //删除之前的接口，避免被占用
            fs.removeSync("/tmp/node_service_starter/health_checking.sock");
            http.createServer(async (req, res) => {
                //log.l('接收到健康检查请求');
                let result = HealthStatus_1.HealthStatus.success;
                //检查每一个服务的健康状况
                for (let item of this._services) {
                    //跳过未启动的服务
                    if (!item.isStarted)
                        continue;
                    try {
                        const status = await item.service.onHealthChecking();
                        if (status != HealthStatus_1.HealthStatus.success) {
                            Log_1.log.w('服务', item.name, '的运行健康状况出现不正常：', status);
                            result = status;
                            break;
                        }
                    }
                    catch (error) {
                        result = HealthStatus_1.HealthStatus.unhealthy;
                        Log_1.log.e('服务', item.name, '在进行健康检查时发生异常', error);
                        break;
                    }
                }
                res.end(result.toString());
            }).listen("/tmp/node_service_starter/health_checking.sock", (err) => {
                if (err) {
                    Log_1.log.e(this.name, '健康检查服务启动失败：', err);
                    process.exit(1);
                }
            });
        }
    }
    /**
     * ServicesManager 的名称，默认是类名。
     */
    get name() {
        return this.constructor.name;
    }
    /**
     * 启动所有注册的服务。按照注册的先后顺序来启动服务。先注册的服务先启动。
     * 如果启动过程中某个服务出现异常，则后面的服务则不再被启动，之前启动过了的服务也会被依次关闭（按照从后向前的顺序）。
     * 启动结束后会触发started事件
     *
     * @memberof ServicesManager
     */
    start() {
        //确保不会重复启动
        if (this._isStarted !== false)
            return;
        Log_1.log.l(this.name, '开始启动服务');
        this._isStarted = true;
        (async () => {
            for (let item of this._services) {
                //避免重复启动
                if (item.isStarted === true)
                    continue;
                try {
                    Log_1.log.starting('开始启动服务', item.name);
                    item.isStarted = true;
                    await item.service.onStart();
                    Log_1.log.started('服务启动成功', item.name);
                }
                catch (error) {
                    Log_1.log.startFailed('服务启动失败', item.name, error);
                    this.stop(1);
                    return;
                }
            }
            Log_1.log.l('所有服务已启动');
            this.emit('started');
        })();
    }
    /**
     * 关闭所有已启动的服务。先注册的服务最后被关闭。当所有服务都被关闭后程序将会被退出。
     * 当所有服务都停止后出发stopped事件
     *
     * @param exitCode 程序退出状态码。 1是系统错误 2是用户ServiceModule的onError发出的‘stop’信号
     */
    stop(exitCode = 0) {
        //确保不会重复关闭
        if (this._isStarted !== true)
            return;
        Log_1.log.l(this.name, '开始停止服务');
        this._isStarted = false;
        (async () => {
            for (let item of Array.from(this._services).reverse()) {
                //只关闭已启动了的服务
                if (item.isStarted === false)
                    continue;
                try {
                    Log_1.log.stopping('开始停止服务', item.name);
                    item.isStarted = false;
                    await item.service.onStop();
                    Log_1.log.stopped('服务启动成功', item.name);
                }
                catch (error) {
                    Log_1.log.stopFailed('服务停止失败', item.name, error);
                }
            }
            Log_1.log.l('所有服务已停止');
            this.emit('stopped');
            //退出服务
            process.exit(exitCode);
        })();
    }
    /**
     * 注册服务
     *
     * @param {ServiceModule} serviceModule 服务模块实例
     * @memberof ServicesManager
     */
    registerService(serviceModule) {
        if (this._services.some(item => item.name == serviceModule.name)) {
            throw new Error(`服务'${serviceModule.name}'已注册过了`);
        }
        else {
            this._services.push(new RegisteredService_1.RegisteredService(serviceModule, this));
        }
    }
    /**
     * 服务运行过程中的错误处理方法。服务启动或关闭过程中产生的错误不会触发该方法。
     *
     * @param {Error} err
     * @param {ServiceModule} service 发生错误的服务实例
     * @memberof ServicesManager
     */
    onError(err, service) {
        Log_1.log.e(service.name, '发生错误：', err);
    }
}
ServicesManager._servicesManagerCreated = false; //ServicesManager是否已经创建了（一个进程只允许创建一个ServicesManager）
exports.ServicesManager = ServicesManager;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VzTWFuYWdlci9TZXJ2aWNlc01hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBa0M7QUFDbEMsNkJBQThCO0FBQzlCLCtCQUFnQztBQUVoQywyREFBd0Q7QUFDeEQsZ0NBQTZCO0FBRTdCLGdFQUE2RDtBQUc3RDs7Ozs7O0dBTUc7QUFDSCxxQkFBNkIsU0FBUSxNQUFNLENBQUMsWUFBWTtJQWlCcEQsWUFBWSxTQUFnQyxFQUFFO1FBQzFDLEtBQUssRUFBRSxDQUFDO1FBaEJKLGVBQVUsR0FBRyxLQUFLLENBQUMsQ0FBSSxRQUFRO1FBVXZDOztXQUVHO1FBQ00sY0FBUyxHQUF3QixFQUFFLENBQUM7UUFLekMsRUFBRSxDQUFDLENBQUMsZUFBZSxDQUFDLHVCQUF1QixDQUFDO1lBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQyxDQUFDO1FBQ25GLGVBQWUsQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUM7UUFFL0MsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLEdBQVU7WUFDeEMsU0FBRyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUVoQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsNEJBQTRCLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQixDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLENBQUMsR0FBVTtZQUN2QyxTQUFHLENBQUMsQ0FBQyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQztZQUV6QixFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsMkJBQTJCLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFD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SUFBSSxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLGFBQWEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUkscUNBQWlCLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxPQUFPLENBQUMsR0FBVSxFQUFFLE9BQXNCO1FBQ3RDLFNBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDdEMsQ0FBQzs7QUFyTGMsdUNBQXVCLEdBQUcsS0FBSyxDQUFDLENBQUMsb0RBQW9EO0FBSHhHLDBDQXlMQyIsImZpbGUiOiJTZXJ2aWNlc01hbmFnZXIvU2VydmljZXNNYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xyXG5pbXBvcnQgaHR0cCA9IHJlcXVpcmUoJ2h0dHAnKTtcclxuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcclxuXHJcbmltcG9ydCB7IFJlZ2lzdGVyZWRTZXJ2aWNlIH0gZnJvbSAnLi9SZWdpc3RlcmVkU2VydmljZSc7XHJcbmltcG9ydCB7IGxvZyB9IGZyb20gJy4uL0xvZyc7XHJcbmltcG9ydCB7IFNlcnZpY2VNb2R1bGUgfSBmcm9tIFwiLi4vU2VydmljZU1vZHVsZS9TZXJ2aWNlTW9kdWxlXCI7XHJcbmltcG9ydCB7IEhlYWx0aFN0YXR1cyB9IGZyb20gXCIuLi9TZXJ2aWNlTW9kdWxlL0hlYWx0aFN0YXR1c1wiO1xyXG5pbXBvcnQgeyBTZXJ2aWNlc01hbmFnZXJDb25maWcgfSBmcm9tIFwiLi9TZXJ2aWNlc01hbmFnZXJDb25maWdcIjtcclxuXHJcbi8qKlxyXG4gKiDmnI3liqHnrqHnkIblmahcclxuICogXHJcbiAqIEBleHBvcnRcclxuICogQGNsYXNzIFNlcnZpY2VzTWFuYWdlclxyXG4gKiBAZXh0ZW5kcyB7ZXZlbnRzLkV2ZW50RW1pdHRlcn1cclxuICovXHJcbmV4cG9ydCBjbGFzcyBTZXJ2aWNlc01hbmFnZXIgZXh0ZW5kcyBldmVudHMuRXZlbnRFbWl0dGVyIHtcclxuXHJcbiAgICBwcml2YXRlIF9pc1N0YXJ0ZWQgPSBmYWxzZTsgICAgLy/mmK/lkKblt7Lnu4/lkK/liqhcclxuICAgIHByaXZhdGUgc3RhdGljIF9zZXJ2aWNlc01hbmFnZXJDcmVhdGVkID0gZmFsc2U7IC8vU2VydmljZXNNYW5hZ2Vy5piv5ZCm5bey57uP5Yib5bu65LqG77yI5LiA5Liq6L+b56iL5Y+q5YWB6K645Yib5bu65LiA5LiqU2VydmljZXNNYW5hZ2Vy77yJXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXJ2aWNlc01hbmFnZXIg55qE5ZCN56ew77yM6buY6K6k5piv57G75ZCN44CCXHJcbiAgICAgKi9cclxuICAgIGdldCBuYW1lKCk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOazqOWGjOeahOacjeWKoeWIl+ihqOOAgijmnI3liqHlj6rlupTlvZPpgJrov4dyZWdpc3RlclNlcnZpY2XmnaXov5vooYzms6jlhowpXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IF9zZXJ2aWNlczogUmVnaXN0ZXJlZFNlcnZpY2VbXSA9IFtdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNvbmZpZzogU2VydmljZXNNYW5hZ2VyQ29uZmlnID0ge30pIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICBpZiAoU2VydmljZXNNYW5hZ2VyLl9zZXJ2aWNlc01hbmFnZXJDcmVhdGVkKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5uYW1lfeW3sue7j+iiq+WIm+W7uuS6hmApO1xyXG4gICAgICAgIFNlcnZpY2VzTWFuYWdlci5fc2VydmljZXNNYW5hZ2VyQ3JlYXRlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIHByb2Nlc3Mub24oJ3VuaGFuZGxlZFJlamVjdGlvbicsIChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIGxvZy5lKCfnqIvluo/lh7rnjrDmnKrmjZXmjYlQcm9taXNl5byC5bi477yaJywgZXJyKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjb25maWcuc3RvcE9uSGF2ZVVuaGFuZGxlZFJlamVjdGlvbiAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBwcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIGxvZy5lKCfnqIvluo/lh7rnjrDmnKrmjZXmjYnlvILluLjvvJonLCBlcnIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlVW5jYXVnaHRFeGNlcHRpb24gIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3AoMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcHJvY2Vzcy5vbignU0lHVEVSTScsICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlU0lHVEVSTSAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHByb2Nlc3Mub24oJ1NJR0lOVCcsICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlU0lHSU5UICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy/phY3nva7lgaXlurfmo4Dmn6XmnI3liqFcclxuICAgICAgICBpZiAoY29uZmlnLnN0YXJ0SGVhbHRoQ2hlY2tpbmcgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIC8v5Yig6Zmk5LmL5YmN55qE5o6l5Y+j77yM6YG/5YWN6KKr5Y2g55SoXHJcbiAgICAgICAgICAgIGZzLnJlbW92ZVN5bmMoXCIvdG1wL25vZGVfc2VydmljZV9zdGFydGVyL2hlYWx0aF9jaGVja2luZy5zb2NrXCIpO1xyXG5cclxuICAgICAgICAgICAgaHR0cC5jcmVhdGVTZXJ2ZXIoYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvL2xvZy5sKCfmjqXmlLbliLDlgaXlurfmo4Dmn6Xor7fmsYInKTtcclxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBIZWFsdGhTdGF0dXMuc3VjY2VzcztcclxuXHJcbiAgICAgICAgICAgICAgICAvL+ajgOafpeavj+S4gOS4quacjeWKoeeahOWBpeW6t+eKtuWGtVxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLl9zZXJ2aWNlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8v6Lez6L+H5pyq5ZCv5Yqo55qE5pyN5YqhXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpdGVtLmlzU3RhcnRlZCkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IGl0ZW0uc2VydmljZS5vbkhlYWx0aENoZWNraW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgIT0gSGVhbHRoU3RhdHVzLnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZy53KCfmnI3liqEnLCBpdGVtLm5hbWUsICfnmoTov5DooYzlgaXlurfnirblhrXlh7rnjrDkuI3mraPluLjvvJonLCBzdGF0dXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gc3RhdHVzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBIZWFsdGhTdGF0dXMudW5oZWFsdGh5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2cuZSgn5pyN5YqhJywgaXRlbS5uYW1lLCAn5Zyo6L+b6KGM5YGl5bq35qOA5p+l5pe25Y+R55Sf5byC5bi4JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChyZXN1bHQudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgIH0pLmxpc3RlbihcIi90bXAvbm9kZV9zZXJ2aWNlX3N0YXJ0ZXIvaGVhbHRoX2NoZWNraW5nLnNvY2tcIiwgKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2cuZSh0aGlzLm5hbWUsICflgaXlurfmo4Dmn6XmnI3liqHlkK/liqjlpLHotKXvvJonLCBlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5ZCv5Yqo5omA5pyJ5rOo5YaM55qE5pyN5Yqh44CC5oyJ54Wn5rOo5YaM55qE5YWI5ZCO6aG65bqP5p2l5ZCv5Yqo5pyN5Yqh44CC5YWI5rOo5YaM55qE5pyN5Yqh5YWI5ZCv5Yqo44CCICAgICBcclxuICAgICAqIOWmguaenOWQr+WKqOi/h+eoi+S4reafkOS4quacjeWKoeWHuueOsOW8guW4uO+8jOWImeWQjumdoueahOacjeWKoeWImeS4jeWGjeiiq+WQr+WKqO+8jOS5i+WJjeWQr+WKqOi/h+S6hueahOacjeWKoeS5n+S8muiiq+S+neasoeWFs+mXre+8iOaMieeFp+S7juWQjuWQkeWJjeeahOmhuuW6j++8ieOAgiAgICAgXHJcbiAgICAgKiDlkK/liqjnu5PmnZ/lkI7kvJrop6blj5FzdGFydGVk5LqL5Lu2XHJcbiAgICAgKiBcclxuICAgICAqIEBtZW1iZXJvZiBTZXJ2aWNlc01hbmFnZXJcclxuICAgICAqL1xyXG4gICAgc3RhcnQoKSB7XHJcbiAgICAgICAgLy/noa7kv53kuI3kvJrph43lpI3lkK/liqhcclxuICAgICAgICBpZiAodGhpcy5faXNTdGFydGVkICE9PSBmYWxzZSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBsb2cubCh0aGlzLm5hbWUsICflvIDlp4vlkK/liqjmnI3liqEnKTtcclxuICAgICAgICB0aGlzLl9pc1N0YXJ0ZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICAoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRoaXMuX3NlcnZpY2VzKSB7XHJcbiAgICAgICAgICAgICAgICAvL+mBv+WFjemHjeWkjeWQr+WKqFxyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0uaXNTdGFydGVkID09PSB0cnVlKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvZy5zdGFydGluZygn5byA5aeL5ZCv5Yqo5pyN5YqhJywgaXRlbS5uYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmlzU3RhcnRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgaXRlbS5zZXJ2aWNlLm9uU3RhcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICBsb2cuc3RhcnRlZCgn5pyN5Yqh5ZCv5Yqo5oiQ5YqfJywgaXRlbS5uYW1lKTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nLnN0YXJ0RmFpbGVkKCfmnI3liqHlkK/liqjlpLHotKUnLCBpdGVtLm5hbWUsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0b3AoMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsb2cubCgn5omA5pyJ5pyN5Yqh5bey5ZCv5YqoJyk7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnc3RhcnRlZCcpO1xyXG4gICAgICAgIH0pKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlhbPpl63miYDmnInlt7LlkK/liqjnmoTmnI3liqHjgILlhYjms6jlhoznmoTmnI3liqHmnIDlkI7ooqvlhbPpl63jgILlvZPmiYDmnInmnI3liqHpg73ooqvlhbPpl63lkI7nqIvluo/lsIbkvJrooqvpgIDlh7rjgIJcclxuICAgICAqIOW9k+aJgOacieacjeWKoemDveWBnOatouWQjuWHuuWPkXN0b3BwZWTkuovku7ZcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIGV4aXRDb2RlIOeoi+W6j+mAgOWHuueKtuaAgeeggeOAgiAx5piv57O757uf6ZSZ6K+vIDLmmK/nlKjmiLdTZXJ2aWNlTW9kdWxl55qEb25FcnJvcuWPkeWHuueahOKAmHN0b3DigJnkv6Hlj7dcclxuICAgICAqL1xyXG4gICAgc3RvcChleGl0Q29kZSA9IDApIHtcclxuICAgICAgICAvL+ehruS/neS4jeS8mumHjeWkjeWFs+mXrVxyXG4gICAgICAgIGlmICh0aGlzLl9pc1N0YXJ0ZWQgIT09IHRydWUpIHJldHVybjtcclxuXHJcbiAgICAgICAgbG9nLmwodGhpcy5uYW1lLCAn5byA5aeL5YGc5q2i5pyN5YqhJyk7XHJcbiAgICAgICAgdGhpcy5faXNTdGFydGVkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIChhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGl0ZW0gb2YgQXJyYXkuZnJvbSh0aGlzLl9zZXJ2aWNlcykucmV2ZXJzZSgpKSB7XHJcbiAgICAgICAgICAgICAgICAvL+WPquWFs+mXreW3suWQr+WKqOS6hueahOacjeWKoVxyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0uaXNTdGFydGVkID09PSBmYWxzZSkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBsb2cuc3RvcHBpbmcoJ+W8gOWni+WBnOatouacjeWKoScsIGl0ZW0ubmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5pc1N0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBpdGVtLnNlcnZpY2Uub25TdG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nLnN0b3BwZWQoJ+acjeWKoeWQr+WKqOaIkOWKnycsIGl0ZW0ubmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvZy5zdG9wRmFpbGVkKCfmnI3liqHlgZzmraLlpLHotKUnLCBpdGVtLm5hbWUsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbG9nLmwoJ+aJgOacieacjeWKoeW3suWBnOatoicpO1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3N0b3BwZWQnKTtcclxuXHJcbiAgICAgICAgICAgIC8v6YCA5Ye65pyN5YqhXHJcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdChleGl0Q29kZSk7XHJcbiAgICAgICAgfSkoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOazqOWGjOacjeWKoVxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge1NlcnZpY2VNb2R1bGV9IHNlcnZpY2VNb2R1bGUg5pyN5Yqh5qih5Z2X5a6e5L6LXHJcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHJlZ2lzdGVyU2VydmljZShzZXJ2aWNlTW9kdWxlOiBTZXJ2aWNlTW9kdWxlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3NlcnZpY2VzLnNvbWUoaXRlbSA9PiBpdGVtLm5hbWUgPT0gc2VydmljZU1vZHVsZS5uYW1lKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOacjeWKoScke3NlcnZpY2VNb2R1bGUubmFtZX0n5bey5rOo5YaM6L+H5LqGYCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fc2VydmljZXMucHVzaChuZXcgUmVnaXN0ZXJlZFNlcnZpY2Uoc2VydmljZU1vZHVsZSwgdGhpcykpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOacjeWKoei/kOihjOi/h+eoi+S4reeahOmUmeivr+WkhOeQhuaWueazleOAguacjeWKoeWQr+WKqOaIluWFs+mXrei/h+eoi+S4reS6p+eUn+eahOmUmeivr+S4jeS8muinpuWPkeivpeaWueazleOAglxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBlcnIgXHJcbiAgICAgKiBAcGFyYW0ge1NlcnZpY2VNb2R1bGV9IHNlcnZpY2Ug5Y+R55Sf6ZSZ6K+v55qE5pyN5Yqh5a6e5L6LXHJcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIG9uRXJyb3IoZXJyOiBFcnJvciwgc2VydmljZTogU2VydmljZU1vZHVsZSkge1xyXG4gICAgICAgIGxvZy5lKHNlcnZpY2UubmFtZSwgJ+WPkeeUn+mUmeivr++8micsIGVycik7XHJcbiAgICB9XHJcbn0iXX0=
