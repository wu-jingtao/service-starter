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
            //要被监听的端口
            const port = "/tmp/service_starter_health_checking.sock";
            //删除之前的接口，避免被占用
            fs.removeSync(port);
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
            }).listen(port, (err) => {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNlcnZpY2VzTWFuYWdlci9TZXJ2aWNlc01hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBa0M7QUFDbEMsNkJBQThCO0FBQzlCLCtCQUFnQztBQUVoQywyREFBd0Q7QUFDeEQsZ0NBQTZCO0FBRTdCLGdFQUE2RDtBQUc3RDs7Ozs7O0dBTUc7QUFDSCxxQkFBNkIsU0FBUSxNQUFNLENBQUMsWUFBWTtJQWlCcEQsWUFBWSxTQUFnQyxFQUFFO1FBQzFDLEtBQUssRUFBRSxDQUFDO1FBaEJKLGVBQVUsR0FBRyxLQUFLLENBQUMsQ0FBSSxRQUFRO1FBVXZDOztXQUVHO1FBQ00sY0FBUyxHQUF3QixFQUFFLENBQUM7UUFLekMsRUFBRSxDQUFDLENBQUMsZUFBZSxDQUFDLHVCQUF1QixDQUFDO1lBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQyxDQUFDO1FBQ25GLGVBQWUsQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUM7UUFFL0MsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLEdBQVU7WUFDeEMsU0FBRyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUVoQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsNEJBQTRCLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQixDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLENBQUMsR0FBVTtZQUN2QyxTQUFHLENBQUMsQ0FBQyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQztZQUV6QixFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsMkJBQTJCLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQixDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRTtZQUNsQixFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDckMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2hCLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFO1lBQ2pCLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDaEIsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsVUFBVTtRQUNWLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLFNBQVM7WUFDVCxNQUFNLElBQUksR0FBRywyQ0FBMkMsQ0FBQztZQUV6RCxlQUFlO1lBQ2YsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVwQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRztnQkFDN0IscUJBQXFCO2dCQUNyQixJQUFJLE1BQU0sR0FBRywyQkFBWSxDQUFDLE9BQU8sQ0FBQztnQkFFbEMsY0FBYztnQkFDZCxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDOUIsVUFBVTtvQkFDVixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7d0JBQUMsUUFBUSxDQUFDO29CQUU5QixJQUFJLENBQUM7d0JBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLENBQUM7d0JBQ3JELEVBQUUsQ0FBQyxDQUFDLE1BQU0sSUFBSSwyQkFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7NEJBQ2pDLFNBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLE1BQU0sQ0FBQyxDQUFDOzRCQUNoRCxNQUFNLEdBQUcsTUFBTSxDQUFDOzRCQUNoQixLQUFLLENBQUM7d0JBQ1YsQ0FBQztvQkFDTCxDQUFDO29CQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBQ2IsTUFBTSxHQUFHLDJCQUFZLENBQUMsU0FBUyxDQUFDO3dCQUNoQyxTQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQzt3QkFDOUMsS0FBSyxDQUFDO29CQUNWLENBQUM7Z0JBQ0wsQ0FBQztnQkFFRCxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQy9CLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFVO2dCQUN2QixFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNOLFNBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQ3JDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7SUFDTCxDQUFDO0lBckZEOztPQUVHO0lBQ0gsSUFBSSxJQUFJO1FBQ0osTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO0lBQ2pDLENBQUM7SUFrRkQ7Ozs7OztPQU1HO0lBQ0gsS0FBSztRQUNELFVBQVU7UUFDVixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxLQUFLLEtBQUssQ0FBQztZQUFDLE1BQU0sQ0FBQztRQUV0QyxTQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFFdkIsQ0FBQyxLQUFLO1lBQ0YsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLFFBQVE7Z0JBQ1IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUM7b0JBQUMsUUFBUSxDQUFDO2dCQUV0QyxJQUFJLENBQUM7b0JBQ0QsU0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNsQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztvQkFDdEIsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUM3QixTQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3JDLENBQUM7Z0JBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDYixTQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUM1QyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNiLE1BQU0sQ0FBQztnQkFDWCxDQUFDO1lBQ0wsQ0FBQztZQUVELFNBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6QixDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ1QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDO1FBQ2IsVUFBVTtRQUNWLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLEtBQUssSUFBSSxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBRXJDLFNBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMzQixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztRQUV4QixDQUFDLEtBQUs7WUFDRixHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BELFlBQVk7Z0JBQ1osRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxLQUFLLENBQUM7b0JBQUMsUUFBUSxDQUFDO2dCQUV2QyxJQUFJLENBQUM7b0JBQ0QsU0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNsQyxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztvQkFDdkIsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUM1QixTQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3JDLENBQUM7Z0JBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDYixTQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMvQyxDQUFDO1lBQ0wsQ0FBQztZQUVELFNBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUVyQixNQUFNO1lBQ04sT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMzQixDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ1QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsZUFBZSxDQUFDLGFBQTRCO1FBQ3hDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLGFBQWEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUkscUNBQWlCLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxPQUFPLENBQUMsR0FBVSxFQUFFLE9BQXNCO1FBQ3RDLFNBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDdEMsQ0FBQzs7QUF4TGMsdUNBQXVCLEdBQUcsS0FBSyxDQUFDLENBQUMsb0RBQW9EO0FBSHhHLDBDQTRMQyIsImZpbGUiOiJTZXJ2aWNlc01hbmFnZXIvU2VydmljZXNNYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuaW1wb3J0IGh0dHAgPSByZXF1aXJlKCdodHRwJyk7XG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuXG5pbXBvcnQgeyBSZWdpc3RlcmVkU2VydmljZSB9IGZyb20gJy4vUmVnaXN0ZXJlZFNlcnZpY2UnO1xuaW1wb3J0IHsgbG9nIH0gZnJvbSAnLi4vTG9nJztcbmltcG9ydCB7IFNlcnZpY2VNb2R1bGUgfSBmcm9tIFwiLi4vU2VydmljZU1vZHVsZS9TZXJ2aWNlTW9kdWxlXCI7XG5pbXBvcnQgeyBIZWFsdGhTdGF0dXMgfSBmcm9tIFwiLi4vU2VydmljZU1vZHVsZS9IZWFsdGhTdGF0dXNcIjtcbmltcG9ydCB7IFNlcnZpY2VzTWFuYWdlckNvbmZpZyB9IGZyb20gXCIuL1NlcnZpY2VzTWFuYWdlckNvbmZpZ1wiO1xuXG4vKipcbiAqIOacjeWKoeeuoeeQhuWZqFxuICogXG4gKiBAZXhwb3J0XG4gKiBAY2xhc3MgU2VydmljZXNNYW5hZ2VyXG4gKiBAZXh0ZW5kcyB7ZXZlbnRzLkV2ZW50RW1pdHRlcn1cbiAqL1xuZXhwb3J0IGNsYXNzIFNlcnZpY2VzTWFuYWdlciBleHRlbmRzIGV2ZW50cy5FdmVudEVtaXR0ZXIge1xuXG4gICAgcHJpdmF0ZSBfaXNTdGFydGVkID0gZmFsc2U7ICAgIC8v5piv5ZCm5bey57uP5ZCv5YqoXG4gICAgcHJpdmF0ZSBzdGF0aWMgX3NlcnZpY2VzTWFuYWdlckNyZWF0ZWQgPSBmYWxzZTsgLy9TZXJ2aWNlc01hbmFnZXLmmK/lkKblt7Lnu4/liJvlu7rkuobvvIjkuIDkuKrov5vnqIvlj6rlhYHorrjliJvlu7rkuIDkuKpTZXJ2aWNlc01hbmFnZXLvvIlcblxuICAgIC8qKlxuICAgICAqIFNlcnZpY2VzTWFuYWdlciDnmoTlkI3np7DvvIzpu5jorqTmmK/nsbvlkI3jgIJcbiAgICAgKi9cbiAgICBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOazqOWGjOeahOacjeWKoeWIl+ihqOOAgijmnI3liqHlj6rlupTlvZPpgJrov4dyZWdpc3RlclNlcnZpY2XmnaXov5vooYzms6jlhowpXG4gICAgICovXG4gICAgcmVhZG9ubHkgX3NlcnZpY2VzOiBSZWdpc3RlcmVkU2VydmljZVtdID0gW107XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IFNlcnZpY2VzTWFuYWdlckNvbmZpZyA9IHt9KSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgaWYgKFNlcnZpY2VzTWFuYWdlci5fc2VydmljZXNNYW5hZ2VyQ3JlYXRlZCkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMubmFtZX3lt7Lnu4/ooqvliJvlu7rkuoZgKTtcbiAgICAgICAgU2VydmljZXNNYW5hZ2VyLl9zZXJ2aWNlc01hbmFnZXJDcmVhdGVkID0gdHJ1ZTtcblxuICAgICAgICBwcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgbG9nLmUoJ+eoi+W6j+WHuueOsOacquaNleaNiVByb21pc2XlvILluLjvvJonLCBlcnIpO1xuXG4gICAgICAgICAgICBpZiAoY29uZmlnLnN0b3BPbkhhdmVVbmhhbmRsZWRSZWplY3Rpb24gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBwcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICBsb2cuZSgn56iL5bqP5Ye6546w5pyq5o2V5o2J5byC5bi477yaJywgZXJyKTtcblxuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlVW5jYXVnaHRFeGNlcHRpb24gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBwcm9jZXNzLm9uKCdTSUdURVJNJywgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlU0lHVEVSTSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcHJvY2Vzcy5vbignU0lHSU5UJywgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlU0lHSU5UICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvL+mFjee9ruWBpeW6t+ajgOafpeacjeWKoVxuICAgICAgICBpZiAoY29uZmlnLnN0YXJ0SGVhbHRoQ2hlY2tpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAvL+imgeiiq+ebkeWQrOeahOerr+WPo1xuICAgICAgICAgICAgY29uc3QgcG9ydCA9IFwiL3RtcC9zZXJ2aWNlX3N0YXJ0ZXJfaGVhbHRoX2NoZWNraW5nLnNvY2tcIjtcblxuICAgICAgICAgICAgLy/liKDpmaTkuYvliY3nmoTmjqXlj6PvvIzpgb/lhY3ooqvljaDnlKhcbiAgICAgICAgICAgIGZzLnJlbW92ZVN5bmMocG9ydCk7XG5cbiAgICAgICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIC8vbG9nLmwoJ+aOpeaUtuWIsOWBpeW6t+ajgOafpeivt+axgicpO1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBIZWFsdGhTdGF0dXMuc3VjY2VzcztcblxuICAgICAgICAgICAgICAgIC8v5qOA5p+l5q+P5LiA5Liq5pyN5Yqh55qE5YGl5bq354q25Ya1XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLl9zZXJ2aWNlcykge1xuICAgICAgICAgICAgICAgICAgICAvL+i3s+i/h+acquWQr+WKqOeahOacjeWKoVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uaXNTdGFydGVkKSBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgaXRlbS5zZXJ2aWNlLm9uSGVhbHRoQ2hlY2tpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgIT0gSGVhbHRoU3RhdHVzLnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2cudygn5pyN5YqhJywgaXRlbS5uYW1lLCAn55qE6L+Q6KGM5YGl5bq354q25Ya15Ye6546w5LiN5q2j5bi477yaJywgc3RhdHVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBzdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBIZWFsdGhTdGF0dXMudW5oZWFsdGh5O1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nLmUoJ+acjeWKoScsIGl0ZW0ubmFtZSwgJ+WcqOi/m+ihjOWBpeW6t+ajgOafpeaXtuWPkeeUn+W8guW4uCcsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzLmVuZChyZXN1bHQudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICB9KS5saXN0ZW4ocG9ydCwgKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZy5lKHRoaXMubmFtZSwgJ+WBpeW6t+ajgOafpeacjeWKoeWQr+WKqOWksei0pe+8micsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWQr+WKqOaJgOacieazqOWGjOeahOacjeWKoeOAguaMieeFp+azqOWGjOeahOWFiOWQjumhuuW6j+adpeWQr+WKqOacjeWKoeOAguWFiOazqOWGjOeahOacjeWKoeWFiOWQr+WKqOOAgiAgICAgXG4gICAgICog5aaC5p6c5ZCv5Yqo6L+H56iL5Lit5p+Q5Liq5pyN5Yqh5Ye6546w5byC5bi477yM5YiZ5ZCO6Z2i55qE5pyN5Yqh5YiZ5LiN5YaN6KKr5ZCv5Yqo77yM5LmL5YmN5ZCv5Yqo6L+H5LqG55qE5pyN5Yqh5Lmf5Lya6KKr5L6d5qyh5YWz6Zet77yI5oyJ54Wn5LuO5ZCO5ZCR5YmN55qE6aG65bqP77yJ44CCICAgICBcbiAgICAgKiDlkK/liqjnu5PmnZ/lkI7kvJrop6blj5FzdGFydGVk5LqL5Lu2XG4gICAgICogXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlclxuICAgICAqL1xuICAgIHN0YXJ0KCkge1xuICAgICAgICAvL+ehruS/neS4jeS8mumHjeWkjeWQr+WKqFxuICAgICAgICBpZiAodGhpcy5faXNTdGFydGVkICE9PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgICAgIGxvZy5sKHRoaXMubmFtZSwgJ+W8gOWni+WQr+WKqOacjeWKoScpO1xuICAgICAgICB0aGlzLl9pc1N0YXJ0ZWQgPSB0cnVlO1xuXG4gICAgICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBpdGVtIG9mIHRoaXMuX3NlcnZpY2VzKSB7XG4gICAgICAgICAgICAgICAgLy/pgb/lhY3ph43lpI3lkK/liqhcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5pc1N0YXJ0ZWQgPT09IHRydWUpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgbG9nLnN0YXJ0aW5nKCflvIDlp4vlkK/liqjmnI3liqEnLCBpdGVtLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmlzU3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGl0ZW0uc2VydmljZS5vblN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGxvZy5zdGFydGVkKCfmnI3liqHlkK/liqjmiJDlip8nLCBpdGVtLm5hbWUpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZy5zdGFydEZhaWxlZCgn5pyN5Yqh5ZCv5Yqo5aSx6LSlJywgaXRlbS5uYW1lLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgxKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbG9nLmwoJ+aJgOacieacjeWKoeW3suWQr+WKqCcpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdzdGFydGVkJyk7XG4gICAgICAgIH0pKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5YWz6Zet5omA5pyJ5bey5ZCv5Yqo55qE5pyN5Yqh44CC5YWI5rOo5YaM55qE5pyN5Yqh5pyA5ZCO6KKr5YWz6Zet44CC5b2T5omA5pyJ5pyN5Yqh6YO96KKr5YWz6Zet5ZCO56iL5bqP5bCG5Lya6KKr6YCA5Ye644CCXG4gICAgICog5b2T5omA5pyJ5pyN5Yqh6YO95YGc5q2i5ZCO5Ye65Y+Rc3RvcHBlZOS6i+S7tlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBleGl0Q29kZSDnqIvluo/pgIDlh7rnirbmgIHnoIHjgIIgMeaYr+ezu+e7n+mUmeivryAy5piv55So5oi3U2VydmljZU1vZHVsZeeahG9uRXJyb3Llj5Hlh7rnmoTigJhzdG9w4oCZ5L+h5Y+3XG4gICAgICovXG4gICAgc3RvcChleGl0Q29kZSA9IDApIHtcbiAgICAgICAgLy/noa7kv53kuI3kvJrph43lpI3lhbPpl61cbiAgICAgICAgaWYgKHRoaXMuX2lzU3RhcnRlZCAhPT0gdHJ1ZSkgcmV0dXJuO1xuXG4gICAgICAgIGxvZy5sKHRoaXMubmFtZSwgJ+W8gOWni+WBnOatouacjeWKoScpO1xuICAgICAgICB0aGlzLl9pc1N0YXJ0ZWQgPSBmYWxzZTtcblxuICAgICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiBBcnJheS5mcm9tKHRoaXMuX3NlcnZpY2VzKS5yZXZlcnNlKCkpIHtcbiAgICAgICAgICAgICAgICAvL+WPquWFs+mXreW3suWQr+WKqOS6hueahOacjeWKoVxuICAgICAgICAgICAgICAgIGlmIChpdGVtLmlzU3RhcnRlZCA9PT0gZmFsc2UpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgbG9nLnN0b3BwaW5nKCflvIDlp4vlgZzmraLmnI3liqEnLCBpdGVtLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmlzU3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBpdGVtLnNlcnZpY2Uub25TdG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIGxvZy5zdG9wcGVkKCfmnI3liqHlkK/liqjmiJDlip8nLCBpdGVtLm5hbWUpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZy5zdG9wRmFpbGVkKCfmnI3liqHlgZzmraLlpLHotKUnLCBpdGVtLm5hbWUsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxvZy5sKCfmiYDmnInmnI3liqHlt7LlgZzmraInKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnc3RvcHBlZCcpO1xuXG4gICAgICAgICAgICAvL+mAgOWHuuacjeWKoVxuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KGV4aXRDb2RlKTtcbiAgICAgICAgfSkoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDms6jlhozmnI3liqFcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1NlcnZpY2VNb2R1bGV9IHNlcnZpY2VNb2R1bGUg5pyN5Yqh5qih5Z2X5a6e5L6LXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlclxuICAgICAqL1xuICAgIHJlZ2lzdGVyU2VydmljZShzZXJ2aWNlTW9kdWxlOiBTZXJ2aWNlTW9kdWxlKSB7XG4gICAgICAgIGlmICh0aGlzLl9zZXJ2aWNlcy5zb21lKGl0ZW0gPT4gaXRlbS5uYW1lID09IHNlcnZpY2VNb2R1bGUubmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5pyN5YqhJyR7c2VydmljZU1vZHVsZS5uYW1lfSflt7Lms6jlhozov4fkuoZgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3NlcnZpY2VzLnB1c2gobmV3IFJlZ2lzdGVyZWRTZXJ2aWNlKHNlcnZpY2VNb2R1bGUsIHRoaXMpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOacjeWKoei/kOihjOi/h+eoi+S4reeahOmUmeivr+WkhOeQhuaWueazleOAguacjeWKoeWQr+WKqOaIluWFs+mXrei/h+eoi+S4reS6p+eUn+eahOmUmeivr+S4jeS8muinpuWPkeivpeaWueazleOAglxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7RXJyb3J9IGVyciBcbiAgICAgKiBAcGFyYW0ge1NlcnZpY2VNb2R1bGV9IHNlcnZpY2Ug5Y+R55Sf6ZSZ6K+v55qE5pyN5Yqh5a6e5L6LXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlclxuICAgICAqL1xuICAgIG9uRXJyb3IoZXJyOiBFcnJvciwgc2VydmljZTogU2VydmljZU1vZHVsZSkge1xuICAgICAgICBsb2cuZShzZXJ2aWNlLm5hbWUsICflj5HnlJ/plJnor6/vvJonLCBlcnIpO1xuICAgIH1cbn0iXX0=
