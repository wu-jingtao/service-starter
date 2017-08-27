import chalk = require('chalk');

/**
 * 用于标准化命令行输出的格式
 */

export class Log {

    /**
     * 格式化console.log输出   
     * [00:00:00] ...
     * 
     */
    l(...args: any[]) {
        console.log(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), ...args);
    }

    /**
     * 格式化console.warn输出   
     * [00:00:00] ...
     * 
     */
    w(...args: any[]) {
        console.warn(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), chalk.yellow(...args));
    }

    /**
     * 格式化console.error输出   
     * [00:00:00] ...
     * 
     */
    e(...args: any[]) {
        console.error(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), chalk.red(...args));
    }

    /**
     * 格式化“正在启动”过程的日志输出。（第二个括号中的内容已白色输出）    
     * [00:00:00] [status] ...
     * 
     * @param status 放在第二个括号中的内容
     * @param name   任务的名称
     * @param args   其他信息
     */
    starting(status: string, name: string, ...args: any[]) {
        console.log(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), `[${status}]`, name, args.length > 0 ? '\r\n' : '', ...args);
    }

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
    started(status: string, name: string, ...args: any[]) {
        console.log(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), `[${chalk.green(status)}]`, name, args.length > 0 ? '\r\n' : '', ...args);
    }

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
    startFailed(status: string, name: string, ...args: any[]) {
        console.error(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), `[${chalk.red(status)}]`, name, args.length > 0 ? '\r\n' : '', ...args);
    }

    /**
     * startFailed的别名
     */
    stopFailed: (status: string, name: string, ...args: any[]) => void;

    constructor() {
        this.stopping = this.starting;
        this.stopped = this.started;
        this.stopFailed = this.startFailed;
    }
}

export const log = new Log();

