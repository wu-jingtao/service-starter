/**
 * ServicesManager的运行状态
 * 
 * @export
 * @enum {number}
 */
export enum ServicesManagerStatus {
    /**
     *  已停止 
     */
    stopped,
    /**
     *  正在运行
     */
    running,
    /**
     *  正在启动
     */
    starting,
    /**
     *  正在停止
     */
    stopping
}