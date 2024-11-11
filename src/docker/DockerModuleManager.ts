import http from 'http';
import log from 'log-formatter';
import { NodeModuleManager, type NodeModuleManagerOptions } from '../node/NodeModuleManager';

export interface DockerModuleManagerOptions extends NodeModuleManagerOptions {
    /**
     * 健康检查服务器的端口号，默认 8000
     */
    healthCheckPort?: number;
}

/**
 * 在 NodeModuleManager 的基础上添加了健康检查的服务器
 * @description
 * 健康返回 200 ok，异常返回 500 bad
 */
export class DockerModuleManager extends NodeModuleManager {
    constructor(options: DockerModuleManagerOptions = {}) {
        super(options);

        // 创建服务器
        const server = http.createServer(async (req, res) => {
            const result = await this.healthCheck();
            if (result) {
                res.statusCode = 500;
                res.end('bad');
            } else {
                res.statusCode = 200;
                res.end('ok');
            }
        });

        server.on('error', err => {
            log.error.dateTime.location.text.red.linebreak(this.name, '健康检查服务器出现异常', err);
        });

        server.listen(options.healthCheckPort ?? 8000);
    }
}
