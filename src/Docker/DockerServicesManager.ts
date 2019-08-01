import http = require('http');
import fs = require('fs-extra');
import log from 'log-formatter';
import { DockerServicesManagerConfig } from './DockerServicesManagerConfig';
import { NodeServicesManager } from './../Node/NodeServicesManager';

/**
 * NodeServicesManager的基础上添加的功docker进行健康检查的服务器。    
 * 服务器监听在 /tmp/service_starter_health_checking.sock
 */
export class DockerServicesManager extends NodeServicesManager {
    constructor(_config: DockerServicesManagerConfig = {}) {
        super(_config);

        if (_config.startHealthChecking !== false && process.platform === 'linux') { //配置健康检查服务
            //要被监听的端口
            const port = "/tmp/service_starter_health_checking.sock";

            //删除之前的端口，避免被占用
            fs.removeSync(port);

            //创建服务器
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