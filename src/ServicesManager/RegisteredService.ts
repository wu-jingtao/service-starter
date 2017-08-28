import { ServiceModule } from "../ServiceModule/ServiceModule";
import { ServicesManager } from "./ServicesManager";

/**
 * 保存注册了的服务。供ServicesManager使用
 * 
 * @class RegisteredService
 */
export class RegisteredService {

    /**
     * 服务实例
     * 
     * @type {ServiceModule}
     */
    readonly service: ServiceModule;

    /**
     * 服务是否已启动
     * 
     * @type {boolean}
     */
    public get isStarted(): boolean {
        return this._isStarted;
    }
    public set isStarted(v: boolean) {
        // 根据是否启动，注册和移除监听器
        if (v && this._isStarted === false) {   //确保不会重复注册
            this.service.on('error', this.errorListener);
        }

        if (v === false && this._isStarted) {
            this.service.removeListener('error', this.errorListener);
        }

        this._isStarted = v;
    }
    private _isStarted: boolean = false;

    /**
     * 服务的名称。（这里再保存一次服务的名称是因为不允许服务名称在运行过程中被改变）
     * 
     * @type {string}
     */
    readonly name: string;

    /**
     * 将要绑定在服务上的错误监听器。
     * 
     * @type {Function}
     */
    readonly errorListener: Function;

    constructor(service: ServiceModule, manager: ServicesManager) {
        this.service = service;
        this.name = service.name;

        //创建服务运行时错误监听器
        this.errorListener = async (err: Error) => {
            const value = await this.service.onError(err);

            switch (value) {
                case false:
                    manager.onError(err, this.service);
                    break;
                case true:
                    break;
                case 'stop':
                    manager.onError(err, this.service);
                    manager.stop(2);
                    break;
                default:
                    if (value instanceof Error)
                        manager.onError(value, this.service);
                    break;
            }
        };
    }
}