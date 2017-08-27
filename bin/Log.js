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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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bGsnKTtcclxuXHJcbi8qKlxyXG4gKiDnlKjkuo7moIflh4bljJblkb3ku6TooYzovpPlh7rnmoTmoLzlvI9cclxuICovXHJcblxyXG5leHBvcnQgY2xhc3MgTG9nIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOagvOW8j+WMlmNvbnNvbGUubG9n6L6T5Ye6ICAgXHJcbiAgICAgKiBbMDA6MDA6MDBdIC4uLlxyXG4gICAgICogXHJcbiAgICAgKi9cclxuICAgIGwoLi4uYXJnczogYW55W10pIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ncmF5KGBbJHsobmV3IERhdGUpLnRvTG9jYWxlVGltZVN0cmluZygpfV0gYCksIC4uLmFyZ3MpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5qC85byP5YyWY29uc29sZS53YXJu6L6T5Ye6ICAgXHJcbiAgICAgKiBbMDA6MDA6MDBdIC4uLlxyXG4gICAgICogXHJcbiAgICAgKi9cclxuICAgIHcoLi4uYXJnczogYW55W10pIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oY2hhbGsuZ3JheShgWyR7KG5ldyBEYXRlKS50b0xvY2FsZVRpbWVTdHJpbmcoKX1dIGApLCBjaGFsay55ZWxsb3coLi4uYXJncykpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5qC85byP5YyWY29uc29sZS5lcnJvcui+k+WHuiAgIFxyXG4gICAgICogWzAwOjAwOjAwXSAuLi5cclxuICAgICAqIFxyXG4gICAgICovXHJcbiAgICBlKC4uLmFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihjaGFsay5ncmF5KGBbJHsobmV3IERhdGUpLnRvTG9jYWxlVGltZVN0cmluZygpfV0gYCksIGNoYWxrLnJlZCguLi5hcmdzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmoLzlvI/ljJbigJzmraPlnKjlkK/liqjigJ3ov4fnqIvnmoTml6Xlv5fovpPlh7rjgILvvIjnrKzkuozkuKrmi6zlj7fkuK3nmoTlhoXlrrnlt7Lnmb3oibLovpPlh7rvvIkgICAgXHJcbiAgICAgKiBbMDA6MDA6MDBdIFtzdGF0dXNdIC4uLlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0gc3RhdHVzIOaUvuWcqOesrOS6jOS4quaLrOWPt+S4reeahOWGheWuuVxyXG4gICAgICogQHBhcmFtIG5hbWUgICDku7vliqHnmoTlkI3np7BcclxuICAgICAqIEBwYXJhbSBhcmdzICAg5YW25LuW5L+h5oGvXHJcbiAgICAgKi9cclxuICAgIHN0YXJ0aW5nKHN0YXR1czogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JheShgWyR7KG5ldyBEYXRlKS50b0xvY2FsZVRpbWVTdHJpbmcoKX1dIGApLCBgWyR7c3RhdHVzfV1gLCBuYW1lLCBhcmdzLmxlbmd0aCA+IDAgPyAnXFxyXFxuJyA6ICcnLCAuLi5hcmdzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHN0YXJ0aW5n55qE5Yir5ZCNXHJcbiAgICAgKi9cclxuICAgIHN0b3BwaW5nOiAoc3RhdHVzOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgLi4uYXJnczogYW55W10pID0+IHZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmoLzlvI/ljJbigJzlkK/liqjmiJDlip/igJ3ov4fnqIvnmoTml6Xlv5fovpPlh7rjgILvvIjnrKzkuozkuKrmi6zlj7fkuK3nmoTlhoXlrrnlt7Lnu7/oibLovpPlh7rvvIkgICAgIFxyXG4gICAgICogWzAwOjAwOjAwXSBbc3RhdHVzXSAuLi5cclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHN0YXR1cyDmlL7lnKjnrKzkuozkuKrmi6zlj7fkuK3nmoTlhoXlrrlcclxuICAgICAqIEBwYXJhbSBuYW1lICAg5Lu75Yqh55qE5ZCN56ewXHJcbiAgICAgKiBAcGFyYW0gYXJncyAgIOWFtuS7luS/oeaBr1xyXG4gICAgICovXHJcbiAgICBzdGFydGVkKHN0YXR1czogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JheShgWyR7KG5ldyBEYXRlKS50b0xvY2FsZVRpbWVTdHJpbmcoKX1dIGApLCBgWyR7Y2hhbGsuZ3JlZW4oc3RhdHVzKX1dYCwgbmFtZSwgYXJncy5sZW5ndGggPiAwID8gJ1xcclxcbicgOiAnJywgLi4uYXJncyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzdGFydGVk55qE5Yir5ZCNXHJcbiAgICAgKi9cclxuICAgIHN0b3BwZWQ6IChzdGF0dXM6IHN0cmluZywgbmFtZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkgPT4gdm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOagvOW8j+WMluKAnOWQr+WKqOWksei0peKAnei/h+eoi+eahOaXpeW/l+i+k+WHuuOAgu+8iOesrOS6jOS4quaLrOWPt+S4reeahOWGheWuueW3sue6ouiJsui+k+WHuu+8iSAgICBcclxuICAgICAqIFswMDowMDowMF0gW3N0YXR1c10gLi4uXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSBzdGF0dXMg5pS+5Zyo56ys5LqM5Liq5ous5Y+35Lit55qE5YaF5a65XHJcbiAgICAgKiBAcGFyYW0gbmFtZSAgIOS7u+WKoeeahOWQjeensFxyXG4gICAgICogQHBhcmFtIGFyZ3MgICDlhbbku5bkv6Hmga9cclxuICAgICAqL1xyXG4gICAgc3RhcnRGYWlsZWQoc3RhdHVzOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgLi4uYXJnczogYW55W10pIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKGNoYWxrLmdyYXkoYFskeyhuZXcgRGF0ZSkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9XSBgKSwgYFske2NoYWxrLnJlZChzdGF0dXMpfV1gLCBuYW1lLCBhcmdzLmxlbmd0aCA+IDAgPyAnXFxyXFxuJyA6ICcnLCAuLi5hcmdzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHN0YXJ0RmFpbGVk55qE5Yir5ZCNXHJcbiAgICAgKi9cclxuICAgIHN0b3BGYWlsZWQ6IChzdGF0dXM6IHN0cmluZywgbmFtZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkgPT4gdm9pZDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnN0b3BwaW5nID0gdGhpcy5zdGFydGluZztcclxuICAgICAgICB0aGlzLnN0b3BwZWQgPSB0aGlzLnN0YXJ0ZWQ7XHJcbiAgICAgICAgdGhpcy5zdG9wRmFpbGVkID0gdGhpcy5zdGFydEZhaWxlZDtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGxvZyA9IG5ldyBMb2coKTtcclxuXHJcbiJdfQ==
