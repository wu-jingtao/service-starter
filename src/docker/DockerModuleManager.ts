import http from 'http';
import log from 'log-formatter';
import { RunningStatus } from '../base/RunningStatus';
import { NodeModuleManager, type NodeModuleManagerOptions, type HealthCheckResult } from '../node/NodeModuleManager';

export interface DockerModuleManagerOptions extends NodeModuleManagerOptions {
    /**
     * 健康检查服务器的端口号，默认 8000
     */
    healthCheckPort?: number;
}

/**
 * 在 NodeModuleManager 的基础上添加了健康检查的服务器
 * @description
 * 健康返回 200，异常返回 500
 */
export class DockerModuleManager extends NodeModuleManager {
    constructor(options: DockerModuleManagerOptions = {}) {
        super(options);

        // 创建服务器
        const server = http.createServer(async (req, res) => {
            const exception = await this.healthCheck();

            if (exception === undefined) {
                res.statusCode = 200;
                res.end(JSON.stringify({
                    healthy: true,
                    managerStatue: RunningStatus[this.status] as keyof typeof RunningStatus,
                    type: 'health_check'
                } satisfies HealthCheckResult));
            } else {
                res.statusCode = 500;
                res.end(JSON.stringify({
                    healthy: false,
                    managerStatue: RunningStatus[this.status] as keyof typeof RunningStatus,
                    moduleName: exception.module?.name,
                    description: exception.error.message,
                    type: 'health_check'
                } satisfies HealthCheckResult));
            }
        });

        server.on('error', (err) => {
            log.error.dateTime.location.text.red.linebreak(this.name, '健康检查服务器出现异常', err);
        });

        server.listen(options.healthCheckPort ?? 8000);
    }
}
