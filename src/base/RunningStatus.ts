/**
 * 标记程序的运行状态
 */
export enum RunningStatus {
    /**
     * 已停止
     */
    stopped,
    /**
     * 正在启动
     */
    starting,
    /**
     * 正在运行
     */
    running,
    /**
     * 正在停止
     */
    stopping,
}
