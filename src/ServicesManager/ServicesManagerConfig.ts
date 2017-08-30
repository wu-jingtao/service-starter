/**
 * ServicesManager配置
 * 
 * @export
 * @interface ServicesManagerConfig
 */
export interface ServicesManagerConfig {
    /**
     * 当有未捕获异常的Promise产生时是否停止服务(默认true,停止)
     * 
     * @type {boolean}
     */
    stopOnHaveUnhandledRejection?: boolean;

    /**
     * 当有未捕获异常产生时是否停止服务(默认true,停止)
     * 
     * @type {boolean}
     */
    stopOnHaveUncaughtException?: boolean;

    /**
     * 当收到SIGTERM信号时是否停止服务(默认true,停止)
     * 
     * @type {boolean}
     */
    stopOnHaveSIGTERM?: boolean;

    /**
    * 当收到SIGINT信号时是否停止服务(默认true,停止)
    * 
    * @type {boolean}
    */
    stopOnHaveSIGINT?: boolean;

    /**
     * 是否启动Docker健康检查(默认true,启动)
     * 
     * @type {boolean}
     */
    startHealthChecking?: boolean;
}