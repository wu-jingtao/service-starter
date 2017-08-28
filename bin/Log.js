"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
/**
 * 用于标准化命令行输出的格式
 */
class Log {
    /**
     * 格式化console.log输出
     * [00:00:00] ...
     *
     */
    l(...args) {
        console.log(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), ...args);
    }
    /**
     * 格式化console.warn输出
     * [00:00:00] ...
     *
     */
    w(...args) {
        console.warn(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), chalk.yellow(...args));
    }
    /**
     * 格式化console.error输出
     * [00:00:00] ...
     *
     */
    e(...args) {
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
    starting(status, name, ...args) {
        console.log(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), `[${status}]`, name, args.length > 0 ? '\r\n' : '', ...args);
    }
    /**
     * 格式化“启动成功”过程的日志输出。（第二个括号中的内容已绿色输出）
     * [00:00:00] [status] ...
     *
     * @param status 放在第二个括号中的内容
     * @param name   任务的名称
     * @param args   其他信息
     */
    started(status, name, ...args) {
        console.log(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), `[${chalk.green(status)}]`, name, args.length > 0 ? '\r\n' : '', ...args);
    }
    /**
     * 格式化“启动失败”过程的日志输出。（第二个括号中的内容已红色输出）
     * [00:00:00] [status] ...
     *
     * @param status 放在第二个括号中的内容
     * @param name   任务的名称
     * @param args   其他信息
     */
    startFailed(status, name, ...args) {
        console.error(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), `[${chalk.red(status)}]`, name, args.length > 0 ? '\r\n' : '', ...args);
    }
    constructor() {
        this.stopping = this.starting;
        this.stopped = this.started;
        this.stopFailed = this.startFailed;
    }
}
exports.Log = Log;
exports.log = new Log();

//# sourceMappingURL=data:application/json;charset=utf8;base64,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bGsnKTtcblxuLyoqXG4gKiDnlKjkuo7moIflh4bljJblkb3ku6TooYzovpPlh7rnmoTmoLzlvI9cbiAqL1xuXG5leHBvcnQgY2xhc3MgTG9nIHtcblxuICAgIC8qKlxuICAgICAqIOagvOW8j+WMlmNvbnNvbGUubG9n6L6T5Ye6ICAgXG4gICAgICogWzAwOjAwOjAwXSAuLi5cbiAgICAgKiBcbiAgICAgKi9cbiAgICBsKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmdyYXkoYFskeyhuZXcgRGF0ZSkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9XSBgKSwgLi4uYXJncyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qC85byP5YyWY29uc29sZS53YXJu6L6T5Ye6ICAgXG4gICAgICogWzAwOjAwOjAwXSAuLi5cbiAgICAgKiBcbiAgICAgKi9cbiAgICB3KC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihjaGFsay5ncmF5KGBbJHsobmV3IERhdGUpLnRvTG9jYWxlVGltZVN0cmluZygpfV0gYCksIGNoYWxrLnllbGxvdyguLi5hcmdzKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qC85byP5YyWY29uc29sZS5lcnJvcui+k+WHuiAgIFxuICAgICAqIFswMDowMDowMF0gLi4uXG4gICAgICogXG4gICAgICovXG4gICAgZSguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGNoYWxrLmdyYXkoYFskeyhuZXcgRGF0ZSkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9XSBgKSwgY2hhbGsucmVkKC4uLmFyZ3MpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmoLzlvI/ljJbigJzmraPlnKjlkK/liqjigJ3ov4fnqIvnmoTml6Xlv5fovpPlh7rjgILvvIjnrKzkuozkuKrmi6zlj7fkuK3nmoTlhoXlrrnlt7Lnmb3oibLovpPlh7rvvIkgICAgXG4gICAgICogWzAwOjAwOjAwXSBbc3RhdHVzXSAuLi5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gc3RhdHVzIOaUvuWcqOesrOS6jOS4quaLrOWPt+S4reeahOWGheWuuVxuICAgICAqIEBwYXJhbSBuYW1lICAg5Lu75Yqh55qE5ZCN56ewXG4gICAgICogQHBhcmFtIGFyZ3MgICDlhbbku5bkv6Hmga9cbiAgICAgKi9cbiAgICBzdGFydGluZyhzdGF0dXM6IHN0cmluZywgbmFtZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ncmF5KGBbJHsobmV3IERhdGUpLnRvTG9jYWxlVGltZVN0cmluZygpfV0gYCksIGBbJHtzdGF0dXN9XWAsIG5hbWUsIGFyZ3MubGVuZ3RoID4gMCA/ICdcXHJcXG4nIDogJycsIC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHN0YXJ0aW5n55qE5Yir5ZCNXG4gICAgICovXG4gICAgc3RvcHBpbmc6IChzdGF0dXM6IHN0cmluZywgbmFtZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkgPT4gdm9pZDtcblxuICAgIC8qKlxuICAgICAqIOagvOW8j+WMluKAnOWQr+WKqOaIkOWKn+KAnei/h+eoi+eahOaXpeW/l+i+k+WHuuOAgu+8iOesrOS6jOS4quaLrOWPt+S4reeahOWGheWuueW3sue7v+iJsui+k+WHuu+8iSAgICAgXG4gICAgICogWzAwOjAwOjAwXSBbc3RhdHVzXSAuLi5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gc3RhdHVzIOaUvuWcqOesrOS6jOS4quaLrOWPt+S4reeahOWGheWuuVxuICAgICAqIEBwYXJhbSBuYW1lICAg5Lu75Yqh55qE5ZCN56ewXG4gICAgICogQHBhcmFtIGFyZ3MgICDlhbbku5bkv6Hmga9cbiAgICAgKi9cbiAgICBzdGFydGVkKHN0YXR1czogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmdyYXkoYFskeyhuZXcgRGF0ZSkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9XSBgKSwgYFske2NoYWxrLmdyZWVuKHN0YXR1cyl9XWAsIG5hbWUsIGFyZ3MubGVuZ3RoID4gMCA/ICdcXHJcXG4nIDogJycsIC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHN0YXJ0ZWTnmoTliKvlkI1cbiAgICAgKi9cbiAgICBzdG9wcGVkOiAoc3RhdHVzOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgLi4uYXJnczogYW55W10pID0+IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiDmoLzlvI/ljJbigJzlkK/liqjlpLHotKXigJ3ov4fnqIvnmoTml6Xlv5fovpPlh7rjgILvvIjnrKzkuozkuKrmi6zlj7fkuK3nmoTlhoXlrrnlt7LnuqLoibLovpPlh7rvvIkgICAgXG4gICAgICogWzAwOjAwOjAwXSBbc3RhdHVzXSAuLi5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gc3RhdHVzIOaUvuWcqOesrOS6jOS4quaLrOWPt+S4reeahOWGheWuuVxuICAgICAqIEBwYXJhbSBuYW1lICAg5Lu75Yqh55qE5ZCN56ewXG4gICAgICogQHBhcmFtIGFyZ3MgICDlhbbku5bkv6Hmga9cbiAgICAgKi9cbiAgICBzdGFydEZhaWxlZChzdGF0dXM6IHN0cmluZywgbmFtZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGNoYWxrLmdyYXkoYFskeyhuZXcgRGF0ZSkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9XSBgKSwgYFske2NoYWxrLnJlZChzdGF0dXMpfV1gLCBuYW1lLCBhcmdzLmxlbmd0aCA+IDAgPyAnXFxyXFxuJyA6ICcnLCAuLi5hcmdzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzdGFydEZhaWxlZOeahOWIq+WQjVxuICAgICAqL1xuICAgIHN0b3BGYWlsZWQ6IChzdGF0dXM6IHN0cmluZywgbmFtZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkgPT4gdm9pZDtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnN0b3BwaW5nID0gdGhpcy5zdGFydGluZztcbiAgICAgICAgdGhpcy5zdG9wcGVkID0gdGhpcy5zdGFydGVkO1xuICAgICAgICB0aGlzLnN0b3BGYWlsZWQgPSB0aGlzLnN0YXJ0RmFpbGVkO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGxvZyA9IG5ldyBMb2coKTtcblxuIl19
