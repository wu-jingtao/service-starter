import chalk = require('chalk');

/**
 * 用于标准化命令行输出的格式
 */
const Log = {
    /**
     * 格式化console.log输出
     * 
     * @static
     * @param {...any[]} args 
     * @memberof Log
     */
    l(...args: any[]) {
        console.log(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), ...args);
    },

    /**
     * 格式化console.warn输出
     * 
     * @static
     * @param {...any[]} args 
     * @memberof Log
     */
    w(...args: any[]) {
        console.warn(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), chalk.yellow(...args));
    },

    /**
     * 格式化console.error输出
     * 
     * @static
     * @param {...any[]} args 
     * @memberof Log
     */
    e(...args: any[]) {
        console.error(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), chalk.red(...args));
    }
};

export default Log;