import http from 'http';
import fs from 'fs';
import log from 'log-formatter';
import { IDockerServicesManagerConfig } from './IDockerServicesManagerConfig';
import { NodeServicesManager } from './../Node/NodeServicesManager';

/**
 * NodeServicesManager的基础上添加的功docker进行健康检查的服务器。    
 * 服务器监听在 /tmp/service_starter_health_checking.sock
 */
export class DockerServicesManager extends NodeServicesManager {
    constructor(_config: IDockerServicesManagerConfig = {}) {
        super(_config);

        if (_config.startHealthChecking !== false && ['linux', 'darwin'].includes(process.platform)) { // 配置健康检查服务
            const port = '/tmp/service_starter_health_checking.sock'; // 要被监听的端口
            fs.unlinkSync(port); // 删除之前的端口，避免被占用

            // 创建服务器
            const server = http.createServer(async (req, res) => {
                const result = await this.healthCheck();
                res.end(result.description);
            });

            server.once('error', err => {
                log.error
                    .location.white
                    .title.red
                    .content.red(this.name, '健康检查服务器出现异常：', err);
            });

            server.listen(port);
        }
    }
}