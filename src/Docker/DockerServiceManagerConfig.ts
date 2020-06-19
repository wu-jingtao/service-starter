import { NodeServiceManagerConfig } from '../Node/NodeServiceManagerConfig';

export interface DockerServiceManagerConfig extends NodeServiceManagerConfig {
    /**
     * 是否启动 Docker 健康检查服务器(默认true,启动)     
     * 注意：只有在 Linux 或 darwin 下才起作用
     */
    startHealthChecking?: boolean;
}

