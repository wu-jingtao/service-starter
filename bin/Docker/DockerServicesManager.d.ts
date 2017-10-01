import { DockerServicesManagerConfig } from './DockerServicesManagerConfig';
import { NodeServicesManager } from './../Node/NodeServicesManager';
/**
 * NodeServicesManager的基础上添加的功docker进行健康检查的服务器。
 * 服务器监听在 /tmp/service_starter_health_checking.sock
 *
 * @export
 * @class DockerServicesManager
 * @extends {NodeServicesManager}
 */
export declare class DockerServicesManager extends NodeServicesManager {
    constructor(_config?: DockerServicesManagerConfig);
}
