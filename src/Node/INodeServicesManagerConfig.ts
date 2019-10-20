/**
 * NodeServicesManager构造函数参数
 */
export interface INodeServicesManagerConfig {
    /**
     * 当有未捕获异常(包括promise rejection)产生时是否停止服务(默认true,停止)
     */
    stopOnUnHandledException?: boolean;

    /**
     * 当有错误发生时是否停止服务(默认false,不停止)
     */
    stopOnError?: boolean;

    /**
     * 当收到SIGTERM信号时是否停止服务(默认true,停止)
     */
    stopOnHaveSIGTERM?: boolean;

    /**
     * 当收到SIGINT信号时是否停止服务(默认true,停止)
     */
    stopOnHaveSIGINT?: boolean;

    /**
     * 当所有服务都停止运行之后是否退出程序(默认true,退出)
     */
    exitAfterStopped?: boolean;
}