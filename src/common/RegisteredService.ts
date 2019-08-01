import log from 'log-formatter';
import { BaseServiceModule } from "./BaseServiceModule";
import { BaseServicesManager } from "./BaseServicesManager";
import { RunningStatus } from "./RunningStatus";

/**
 * 对于注册服务的生命周期进行管理。
 * 对注册了的服务进行一层封装，便于ServicesManager使用。
 */
export class RegisteredService {

    /**
     * 保存对服务管理器的引用
     */
    private readonly _manager: BaseServicesManager;

    /**
     * 绑定在服务模块上的错误监听器
     */
    private readonly _errorListener = async (err: Error) => {
        const value = await this.service.onError(err);
        if (value !== false) this._manager.onError(value, this.service);
    };

    /**
     * 服务实例
     */
    readonly service: BaseServiceModule;

    constructor(service: BaseServiceModule, manager: BaseServicesManager) {
        this._manager = manager;
        this.service = service;
        this.service.servicesManager = manager; //给服务绑定管理器
    }

    /**
     * 启动服务。成功返回void，失败返回Error。    
     * 如果抛出异常则一定是service-starter的逻辑错误      
     * 这个方法仅供内部使用。
     */
    async start(): Promise<Error | void> {
        if (this.service.runningStatus === RunningStatus.stopping)
            throw new Error(`服务 [${this.service.name}] 处于正在关闭的情况下又再次被启动`);

        if (this.service.runningStatus === RunningStatus.stopped) {
            try {
                log.location.title.blue(this.service.name, '开始启动');
                this.service.runningStatus = RunningStatus.starting;

                this.service.on('error', this._errorListener);
                await this.service.onStart();

                log.location.title.green(this.service.name, '启动成功');
                this.service.runningStatus = RunningStatus.running;
            } catch (err) {
                log.error
                    .location.white
                    .title.red
                    .content.red(this.service.name, '启动失败', err);

                await this.stop();
                return err;
            }
        }
    }

    /**
     * 停止服务。    
     * 如果抛出异常则一定是service-starter的逻辑错误      
     * 这个方法仅供内部使用。
     */
    async stop(): Promise<void> {
        if (this.service.runningStatus === RunningStatus.starting || this.service.runningStatus === RunningStatus.running) {
            try {
                log.location.title.blue(this.service.name, '开始停止');
                this.service.runningStatus = RunningStatus.stopping;

                await this.service.onStop();

                log.location.title.green(this.service.name, '停止成功');
            } catch (err) {
                log.warn
                    .location.white
                    .title.yellow
                    .content.yellow(this.service.name, '停止失败', err);
            } finally {
                this.service.runningStatus = RunningStatus.stopped;
                this.service.off('error', this._errorListener);
            }
        }
    }

    /**
     * 健康检查。
     * 如果抛出异常则一定是service-starter的逻辑错误       
     * 这个方法仅供内部使用。
     */
    async healthCheck(): Promise<Error | void> {
        if (this.service.runningStatus === RunningStatus.running) {
            try {
                await this.service.onHealthCheck();
            } catch (err) {
                log.warn
                    .location.white
                    .title.yellow
                    .content.yellow(`服务：${this.service.name}`, '运行状况异常：', err);
                return err;
            }
        }
    }
}