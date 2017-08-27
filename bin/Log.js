"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
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
    l(...args) {
        console.log(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), ...args);
    },
    /**
     * 格式化console.warn输出
     *
     * @static
     * @param {...any[]} args
     * @memberof Log
     */
    w(...args) {
        console.warn(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), chalk.yellow(...args));
    },
    /**
     * 格式化console.error输出
     *
     * @static
     * @param {...any[]} args
     * @memberof Log
     */
    e(...args) {
        console.error(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), chalk.red(...args));
    }
};
exports.default = Log;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkxvZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLCtCQUFnQztBQUVoQzs7R0FFRztBQUNILE1BQU0sR0FBRyxHQUFHO0lBQ1I7Ozs7OztPQU1HO0lBQ0gsQ0FBQyxDQUFDLEdBQUcsSUFBVztRQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQzlFLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxDQUFDLENBQUMsR0FBRyxJQUFXO1FBQ1osT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzdGLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxDQUFDLENBQUMsR0FBRyxJQUFXO1FBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzNGLENBQUM7Q0FDSixDQUFDO0FBRUYsa0JBQWUsR0FBRyxDQUFDIiwiZmlsZSI6IkxvZy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayA9IHJlcXVpcmUoJ2NoYWxrJyk7XHJcblxyXG4vKipcclxuICog55So5LqO5qCH5YeG5YyW5ZG95Luk6KGM6L6T5Ye655qE5qC85byPXHJcbiAqL1xyXG5jb25zdCBMb2cgPSB7XHJcbiAgICAvKipcclxuICAgICAqIOagvOW8j+WMlmNvbnNvbGUubG9n6L6T5Ye6XHJcbiAgICAgKiBcclxuICAgICAqIEBzdGF0aWNcclxuICAgICAqIEBwYXJhbSB7Li4uYW55W119IGFyZ3MgXHJcbiAgICAgKiBAbWVtYmVyb2YgTG9nXHJcbiAgICAgKi9cclxuICAgIGwoLi4uYXJnczogYW55W10pIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhjaGFsay5ncmF5KGBbJHsobmV3IERhdGUpLnRvTG9jYWxlVGltZVN0cmluZygpfV0gYCksIC4uLmFyZ3MpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIOagvOW8j+WMlmNvbnNvbGUud2Fybui+k+WHulxyXG4gICAgICogXHJcbiAgICAgKiBAc3RhdGljXHJcbiAgICAgKiBAcGFyYW0gey4uLmFueVtdfSBhcmdzIFxyXG4gICAgICogQG1lbWJlcm9mIExvZ1xyXG4gICAgICovXHJcbiAgICB3KC4uLmFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKGNoYWxrLmdyYXkoYFskeyhuZXcgRGF0ZSkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9XSBgKSwgY2hhbGsueWVsbG93KC4uLmFyZ3MpKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmoLzlvI/ljJZjb25zb2xlLmVycm9y6L6T5Ye6XHJcbiAgICAgKiBcclxuICAgICAqIEBzdGF0aWNcclxuICAgICAqIEBwYXJhbSB7Li4uYW55W119IGFyZ3MgXHJcbiAgICAgKiBAbWVtYmVyb2YgTG9nXHJcbiAgICAgKi9cclxuICAgIGUoLi4uYXJnczogYW55W10pIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKGNoYWxrLmdyYXkoYFskeyhuZXcgRGF0ZSkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9XSBgKSwgY2hhbGsucmVkKC4uLmFyZ3MpKTtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IExvZzsiXX0=
