/**
 * ServicesManager配置
 * 
 * @export
 * @interface ServicesManagerConfig
 */
export interface ServicesManagerConfig {
    /**
     * 当有未捕获异常的Promise产生时是否停止服务(默认true,停止)
     */
    stopOnHaveUnhandledRejection?: boolean;

    /**
     * 当有未捕获异常产生时是否停止服务(默认true,停止)
     */
    stopOnHaveUncaughtException?: boolean;

    /**
     * 当收到SIGTERM信号时是否停止服务(默认true,停止)
     */
    stopOnHaveSIGTERM?: boolean;

    /**
    * 当收到SIGINT信号时是否停止服务(默认true,停止)
    */
    stopOnHaveSIGINT?: boolean;

    /**
     * 是否启动Docker健康检查(默认true,启动)
     */
    startHealthChecking?: boolean;

    /**
     * 当所有服务都停止运行之后是否退出程序(默认true,退出)
     */
    exitAfterStopped?: boolean;
}