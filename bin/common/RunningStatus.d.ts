/**
 * 标记程序的运行状态
 *
 * @export
 * @enum {number}
 */
export declare enum RunningStatus {
    /**
     *  已停止
     */
    stopped = 0,
    /**
     *  正在运行
     */
    running = 1,
    /**
     *  正在启动
     */
    starting = 2,
    /**
     *  正在停止
     */
    stopping = 3,
}
