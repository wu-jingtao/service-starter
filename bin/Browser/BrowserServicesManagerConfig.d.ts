/**
 * BrowserServicesManager构造函数参数。
 * 注意：stopOnError选项的默认值正好与NodeServicesManagerConfig的相反
 *
 * @export
 * @interface BrowserServicesManagerConfig
 */
export interface BrowserServicesManagerConfig {
    /**
     * 当有错误发生时是否停止服务(默认false,不停止)
     */
    stopOnError?: boolean;
}
