/**
 * 用于标准化命令行输出的格式
 */
export declare class Log {
    /**
     * 格式化console.log输出
     * [00:00:00] ...
     *
     */
    l(...args: any[]): void;
    /**
     * 格式化console.warn输出
     * [00:00:00] ...
     *
     */
    w(...args: any[]): void;
    /**
     * 格式化console.error输出
     * [00:00:00] ...
     *
     */
    e(...args: any[]): void;
    /**
     * 格式化“正在启动”过程的日志输出。（第二个括号中的内容已白色输出）
     * [00:00:00] [status] ...
     *
     * @param status 放在第二个括号中的内容
     * @param name   任务的名称
     * @param args   其他信息
     */
    starting(status: string, name: string, ...args: any[]): void;
    /**
     * starting的别名
     */
    stopping: (status: string, name: string, ...args: any[]) => void;
    /**
     * 格式化“启动成功”过程的日志输出。（第二个括号中的内容已绿色输出）
     * [00:00:00] [status] ...
     *
     * @param status 放在第二个括号中的内容
     * @param name   任务的名称
     * @param args   其他信息
     */
    started(status: string, name: string, ...args: any[]): void;
    /**
     * started的别名
     */
    stopped: (status: string, name: string, ...args: any[]) => void;
    /**
     * 格式化“启动失败”过程的日志输出。（第二个括号中的内容已红色输出）
     * [00:00:00] [status] ...
     *
     * @param status 放在第二个括号中的内容
     * @param name   任务的名称
     * @param args   其他信息
     */
    startFailed(status: string, name: string, ...args: any[]): void;
    /**
     * startFailed的别名
     */
    stopFailed: (status: string, name: string, ...args: any[]) => void;
    constructor();
}
export declare const log: Log;
