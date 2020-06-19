import log from 'log-formatter';
import { ServiceModule } from './ServiceModule';
import { BaseServiceManager } from './BaseServiceManager';
import { RunningStatus } from './RunningStatus';

/**
 * 对于注册的服务模块的生命周期进行管理
 */
export class RegisteredServiceModule {

    /**
     * 保存对服务管理器的引用
     */
    private readonly _servicesManager: BaseServiceManager;

    /**
     * 服务模块实例
     */
    readonly serviceModule: ServiceModule;

    constructor(serviceModule: ServiceModule, serviceManager: BaseServiceManager) {
        this._servicesManager = serviceManager;
        this.serviceModule = serviceModule;

        // @ts-expect-error
        this.serviceModule.servicesManager = serviceManager; // 给服务绑定管理器
    }

    /**
     * 绑定在服务模块上的错误监听器
     */
    private readonly _errorListener = async (err: Error): Promise<void> => {
        const value = await this.serviceModule.onError(err);
        if (value !== false) this._servicesManager.onError(value || err, this.serviceModule);
    };

    /**
     * 启动服务模块。成功返回 void，失败返回 Error。    
     * 注意：这个方法仅供内部使用。
     */
    async start(): Promise<Error | void> {
        switch (this.serviceModule.runningStatus) {
            case RunningStatus.stopping:
                throw new Error(`服务模块 [${this.serviceModule.name}] 处于正在关闭的情况下又再次被启动`);

            case RunningStatus.stopped:
                try {
                    log.location.title.blue(this.serviceModule.name, '开始启动');

                    // @ts-expect-error
                    this.serviceModule.runningStatus = RunningStatus.starting;

                    this.serviceModule.on('error', this._errorListener);
                    await this.serviceModule.onStart();

                    log.location.title.green(this.serviceModule.name, '启动成功');

                    // @ts-expect-error
                    this.serviceModule.runningStatus = RunningStatus.running;
                } catch (err) {
                    log.error
                        .location.white
                        .title.red
                        .content.red(this.serviceModule.name, '启动失败', err);

                    await this.stop();
                    return err;
                }
                break;
        }
    }

    /**
     * 停止服务模块。    
     * 注意：这个方法仅供内部使用。
     */
    async stop(): Promise<void> {
        switch (this.serviceModule.runningStatus) {
            case RunningStatus.starting:
            case RunningStatus.running:
                try {
                    log.location.title.blue(this.serviceModule.name, '开始停止');

                    // @ts-expect-error
                    this.serviceModule.runningStatus = RunningStatus.stopping;
                    await this.serviceModule.onStop();

                    log.location.title.green(this.serviceModule.name, '停止成功');
                } catch (err) {
                    log.warn
                        .location.white
                        .title.yellow
                        .content.yellow(this.serviceModule.name, '停止失败', err);
                }

                // @ts-expect-error
                this.serviceModule.runningStatus = RunningStatus.stopped;
                this.serviceModule.off('error', this._errorListener);
                break;
        }
    }

    /**
     * 健康检查。      
     * 注意：这个方法仅供内部使用。
     */
    async healthCheck(): Promise<Error | void> {
        if (this.serviceModule.runningStatus === RunningStatus.running) {
            try {
                await this.serviceModule.onHealthCheck();
            } catch (err) {
                log.warn
                    .location.white
                    .title.yellow
                    .content.yellow(`服务：${this.serviceModule.name}`, '运行状况异常：', err);
                return err;
            }
        }
    }
}