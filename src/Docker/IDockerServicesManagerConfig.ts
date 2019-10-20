import { INodeServicesManagerConfig } from '../Node/INodeServicesManagerConfig';

export interface IDockerServicesManagerConfig extends INodeServicesManagerConfig {
    /**
     * 是否启动Docker健康检查服务器(默认true,启动)     
     * 注意：只有在Linux下才起作用
     */
    startHealthChecking?: boolean;
}

