import chalk = require('chalk');

/**
 * 用于标准化命令行输出的格式
 */

export const log = {
    /**
     * chalk库
     */
    chalk,

    /**
     * 格式化console.log输出   
     * [00:00:00] ...
     * 
     */
    l(...args: any[]) {
        console.log(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), ...args);
    },

    /**
     * 格式化console.warn输出   
     * [00:00:00] ...
     * 
     */
    w(...args: any[]) {
        console.warn(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), chalk.yellow(...args));
    },

    /**
     * 格式化console.error输出   
     * [00:00:00] ...
     * 
     */
    e(...args: any[]) {
        console.error(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), chalk.red(...args));
    },

    /**
     * squareN：用方括号包裹打印输出
     */
    sn: {
        /**
         * 对前n个参数使用方括号包裹，并使用log.l输出
         * 
         * @param {number} n 对前n个参数使用方括号包裹
         * @param {...any[]} args 
         */
        l(n: number, ...args: any[]) {
            log.l(this.format(n, ...args));
        },

        /**
         * 对前n个参数使用方括号包裹，并使用log.w输出
         * 
         * @param {number} n 对前n个参数使用方括号包裹
         * @param {...any[]} args 
         */
        w(n: number, ...args: any[]) {
            log.w(this.format(n, ...args));
        },

        /**
         * 对前n个参数使用方括号包裹，并使用log.e输出
         * 
         * @param {number} n 对前n个参数使用方括号包裹
         * @param {...any[]} args 
         */
        e(n: number, ...args: any[]) {
            log.e(this.format(n, ...args));
        },

        /**
         * 对前n个参数使用方括号包裹,并返回格式化后的结果
         * 
         * @param {number} n 对前n个参数使用方括号包裹
         * @param {...any[]} args 
         * @returns {string} 
         */
        format(n: number, ...args: any[]): string {
            for (var index = 0; index < n; index++) {
                args[index] = `[${args[index]}]`;
            }
            return args.join(' ');
        }
    },

    /**
     * square1：简化sn的使用，对第一个参数使用方括号包裹输出
     */
    s1: {
        l(...args: any[]) {
            log.sn.l(1, ...args);
        },

        w(...args: any[]) {
            log.sn.w(1, ...args);
        },

        e(...args: any[]) {
            log.sn.e(1, ...args);
        },
        format(...args: any[]) {
            return log.sn.format(1, ...args);
        }
    },

    /**
     * square2：简化sn的使用，对前两个参数使用方括号包裹输出
     */
    s2: {
        l(...args: any[]) {
            log.sn.l(2, ...args);
        },

        w(...args: any[]) {
            log.sn.w(2, ...args);
        },

        e(...args: any[]) {
            log.sn.e(2, ...args);
        },
        format(...args: any[]) {
            return log.sn.format(2, ...args);
        }
    }
};