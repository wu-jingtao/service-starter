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
        console.log(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), `[${chalk.blue(status)}]`, name, args.length > 0 ? '\r\n' : '', ...args);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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cG9ydCBjaGFsayA9IHJlcXVpcmUoJ2NoYWxrJyk7XG5cbi8qKlxuICog55So5LqO5qCH5YeG5YyW5ZG95Luk6KGM6L6T5Ye655qE5qC85byPXG4gKi9cblxuZXhwb3J0IGNsYXNzIExvZyB7XG5cbiAgICAvKipcbiAgICAgKiDmoLzlvI/ljJZjb25zb2xlLmxvZ+i+k+WHuiAgIFxuICAgICAqIFswMDowMDowMF0gLi4uXG4gICAgICogXG4gICAgICovXG4gICAgbCguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ncmF5KGBbJHsobmV3IERhdGUpLnRvTG9jYWxlVGltZVN0cmluZygpfV0gYCksIC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOagvOW8j+WMlmNvbnNvbGUud2Fybui+k+WHuiAgIFxuICAgICAqIFswMDowMDowMF0gLi4uXG4gICAgICogXG4gICAgICovXG4gICAgdyguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICBjb25zb2xlLndhcm4oY2hhbGsuZ3JheShgWyR7KG5ldyBEYXRlKS50b0xvY2FsZVRpbWVTdHJpbmcoKX1dIGApLCBjaGFsay55ZWxsb3coLi4uYXJncykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOagvOW8j+WMlmNvbnNvbGUuZXJyb3LovpPlh7ogICBcbiAgICAgKiBbMDA6MDA6MDBdIC4uLlxuICAgICAqIFxuICAgICAqL1xuICAgIGUoLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihjaGFsay5ncmF5KGBbJHsobmV3IERhdGUpLnRvTG9jYWxlVGltZVN0cmluZygpfV0gYCksIGNoYWxrLnJlZCguLi5hcmdzKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5qC85byP5YyW4oCc5q2j5Zyo5ZCv5Yqo4oCd6L+H56iL55qE5pel5b+X6L6T5Ye644CC77yI56ys5LqM5Liq5ous5Y+35Lit55qE5YaF5a655bey55m96Imy6L6T5Ye677yJICAgIFxuICAgICAqIFswMDowMDowMF0gW3N0YXR1c10gLi4uXG4gICAgICogXG4gICAgICogQHBhcmFtIHN0YXR1cyDmlL7lnKjnrKzkuozkuKrmi6zlj7fkuK3nmoTlhoXlrrlcbiAgICAgKiBAcGFyYW0gbmFtZSAgIOS7u+WKoeeahOWQjeensFxuICAgICAqIEBwYXJhbSBhcmdzICAg5YW25LuW5L+h5oGvXG4gICAgICovXG4gICAgc3RhcnRpbmcoc3RhdHVzOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JheShgWyR7KG5ldyBEYXRlKS50b0xvY2FsZVRpbWVTdHJpbmcoKX1dIGApLCBgWyR7Y2hhbGsuYmx1ZShzdGF0dXMpfV1gLCBuYW1lLCBhcmdzLmxlbmd0aCA+IDAgPyAnXFxyXFxuJyA6ICcnLCAuLi5hcmdzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzdGFydGluZ+eahOWIq+WQjVxuICAgICAqL1xuICAgIHN0b3BwaW5nOiAoc3RhdHVzOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgLi4uYXJnczogYW55W10pID0+IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiDmoLzlvI/ljJbigJzlkK/liqjmiJDlip/igJ3ov4fnqIvnmoTml6Xlv5fovpPlh7rjgILvvIjnrKzkuozkuKrmi6zlj7fkuK3nmoTlhoXlrrnlt7Lnu7/oibLovpPlh7rvvIkgICAgIFxuICAgICAqIFswMDowMDowMF0gW3N0YXR1c10gLi4uXG4gICAgICogXG4gICAgICogQHBhcmFtIHN0YXR1cyDmlL7lnKjnrKzkuozkuKrmi6zlj7fkuK3nmoTlhoXlrrlcbiAgICAgKiBAcGFyYW0gbmFtZSAgIOS7u+WKoeeahOWQjeensFxuICAgICAqIEBwYXJhbSBhcmdzICAg5YW25LuW5L+h5oGvXG4gICAgICovXG4gICAgc3RhcnRlZChzdGF0dXM6IHN0cmluZywgbmFtZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ncmF5KGBbJHsobmV3IERhdGUpLnRvTG9jYWxlVGltZVN0cmluZygpfV0gYCksIGBbJHtjaGFsay5ncmVlbihzdGF0dXMpfV1gLCBuYW1lLCBhcmdzLmxlbmd0aCA+IDAgPyAnXFxyXFxuJyA6ICcnLCAuLi5hcmdzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzdGFydGVk55qE5Yir5ZCNXG4gICAgICovXG4gICAgc3RvcHBlZDogKHN0YXR1czogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICog5qC85byP5YyW4oCc5ZCv5Yqo5aSx6LSl4oCd6L+H56iL55qE5pel5b+X6L6T5Ye644CC77yI56ys5LqM5Liq5ous5Y+35Lit55qE5YaF5a655bey57qi6Imy6L6T5Ye677yJICAgIFxuICAgICAqIFswMDowMDowMF0gW3N0YXR1c10gLi4uXG4gICAgICogXG4gICAgICogQHBhcmFtIHN0YXR1cyDmlL7lnKjnrKzkuozkuKrmi6zlj7fkuK3nmoTlhoXlrrlcbiAgICAgKiBAcGFyYW0gbmFtZSAgIOS7u+WKoeeahOWQjeensFxuICAgICAqIEBwYXJhbSBhcmdzICAg5YW25LuW5L+h5oGvXG4gICAgICovXG4gICAgc3RhcnRGYWlsZWQoc3RhdHVzOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihjaGFsay5ncmF5KGBbJHsobmV3IERhdGUpLnRvTG9jYWxlVGltZVN0cmluZygpfV0gYCksIGBbJHtjaGFsay5yZWQoc3RhdHVzKX1dYCwgbmFtZSwgYXJncy5sZW5ndGggPiAwID8gJ1xcclxcbicgOiAnJywgLi4uYXJncyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogc3RhcnRGYWlsZWTnmoTliKvlkI1cbiAgICAgKi9cbiAgICBzdG9wRmFpbGVkOiAoc3RhdHVzOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgLi4uYXJnczogYW55W10pID0+IHZvaWQ7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5zdG9wcGluZyA9IHRoaXMuc3RhcnRpbmc7XG4gICAgICAgIHRoaXMuc3RvcHBlZCA9IHRoaXMuc3RhcnRlZDtcbiAgICAgICAgdGhpcy5zdG9wRmFpbGVkID0gdGhpcy5zdGFydEZhaWxlZDtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBsb2cgPSBuZXcgTG9nKCk7XG5cbiJdfQ==
