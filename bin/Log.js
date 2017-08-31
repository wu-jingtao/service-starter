"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
/**
 * 用于标准化命令行输出的格式
 */
exports.log = {
    /**
     * chalk库
     */
    chalk,
    /**
     * 格式化console.log输出
     * [00:00:00] ...
     *
     */
    l(...args) {
        console.log(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), ...args);
    },
    /**
     * 格式化console.warn输出
     * [00:00:00] ...
     *
     */
    w(...args) {
        console.warn(chalk.gray(`[${(new Date).toLocaleTimeString()}] `), chalk.yellow(...args));
    },
    /**
     * 格式化console.error输出
     * [00:00:00] ...
     *
     */
    e(...args) {
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
        l(n, ...args) {
            exports.log.l(exports.log.sn.format(n, ...args));
        },
        /**
         * 对前n个参数使用方括号包裹，并使用log.w输出
         *
         * @param {number} n 对前n个参数使用方括号包裹
         * @param {...any[]} args
         */
        w(n, ...args) {
            exports.log.w(exports.log.sn.format(n, ...args));
        },
        /**
         * 对前n个参数使用方括号包裹，并使用log.e输出
         *
         * @param {number} n 对前n个参数使用方括号包裹
         * @param {...any[]} args
         */
        e(n, ...args) {
            exports.log.e(exports.log.sn.format(n, ...args));
        },
        /**
         * 对前n个参数使用方括号包裹,并返回格式化后的结果
         *
         * @param {number} n 对前n个参数使用方括号包裹
         * @param {...any[]} args
         * @returns {string}
         */
        format(n, ...args) {
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
        l(...args) {
            exports.log.sn.l(1, ...args);
        },
        w(...args) {
            exports.log.sn.w(1, ...args);
        },
        e(...args) {
            exports.log.sn.e(1, ...args);
        },
        format(...args) {
            return exports.log.sn.format(1, ...args);
        }
    },
    /**
     * square2：简化sn的使用，对前两个参数使用方括号包裹输出
     */
    s2: {
        l(...args) {
            exports.log.sn.l(2, ...args);
        },
        w(...args) {
            exports.log.sn.w(2, ...args);
        },
        e(...args) {
            exports.log.sn.e(2, ...args);
        },
        format(...args) {
            return exports.log.sn.format(2, ...args);
        }
    }
};

//# sourceMappingURL=data:application/json;charset=utf8;base64,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WUFDakIsTUFBTSxDQUFDLFdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ3JDLENBQUM7S0FDSjtJQUVEOztPQUVHO0lBQ0gsRUFBRSxFQUFFO1FBQ0EsQ0FBQyxDQUFDLEdBQUcsSUFBVztZQUNaLFdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxDQUFDLENBQUMsR0FBRyxJQUFXO1lBQ1osV0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDekIsQ0FBQztRQUVELENBQUMsQ0FBQyxHQUFHLElBQVc7WUFDWixXQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUN6QixDQUFDO1FBQ0QsTUFBTSxDQUFDLEdBQUcsSUFBVztZQUNqQixNQUFNLENBQUMsV0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztLQUNKO0NBQ0osQ0FBQyIsImZpbGUiOiJMb2cuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgPSByZXF1aXJlKCdjaGFsaycpO1xuXG4vKipcbiAqIOeUqOS6juagh+WHhuWMluWRveS7pOihjOi+k+WHuueahOagvOW8j1xuICovXG5cbmV4cG9ydCBjb25zdCBsb2cgPSB7XG4gICAgLyoqXG4gICAgICogY2hhbGvlupNcbiAgICAgKi9cbiAgICBjaGFsayxcblxuICAgIC8qKlxuICAgICAqIOagvOW8j+WMlmNvbnNvbGUubG9n6L6T5Ye6ICAgXG4gICAgICogWzAwOjAwOjAwXSAuLi5cbiAgICAgKiBcbiAgICAgKi9cbiAgICBsKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmdyYXkoYFskeyhuZXcgRGF0ZSkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9XSBgKSwgLi4uYXJncyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOagvOW8j+WMlmNvbnNvbGUud2Fybui+k+WHuiAgIFxuICAgICAqIFswMDowMDowMF0gLi4uXG4gICAgICogXG4gICAgICovXG4gICAgdyguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICBjb25zb2xlLndhcm4oY2hhbGsuZ3JheShgWyR7KG5ldyBEYXRlKS50b0xvY2FsZVRpbWVTdHJpbmcoKX1dIGApLCBjaGFsay55ZWxsb3coLi4uYXJncykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDmoLzlvI/ljJZjb25zb2xlLmVycm9y6L6T5Ye6ICAgXG4gICAgICogWzAwOjAwOjAwXSAuLi5cbiAgICAgKiBcbiAgICAgKi9cbiAgICBlKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoY2hhbGsuZ3JheShgWyR7KG5ldyBEYXRlKS50b0xvY2FsZVRpbWVTdHJpbmcoKX1dIGApLCBjaGFsay5yZWQoLi4uYXJncykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBzcXVhcmVO77ya55So5pa55ous5Y+35YyF6KO55omT5Y2w6L6T5Ye6XG4gICAgICovXG4gICAgc246IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWvueWJjW7kuKrlj4LmlbDkvb/nlKjmlrnmi6zlj7fljIXoo7nvvIzlubbkvb/nlKhsb2cubOi+k+WHulxuICAgICAgICAgKiBcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ9IG4g5a+55YmNbuS4quWPguaVsOS9v+eUqOaWueaLrOWPt+WMheijuVxuICAgICAgICAgKiBAcGFyYW0gey4uLmFueVtdfSBhcmdzIFxuICAgICAgICAgKi9cbiAgICAgICAgbChuOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICBsb2cubChsb2cuc24uZm9ybWF0KG4sIC4uLmFyZ3MpKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICog5a+55YmNbuS4quWPguaVsOS9v+eUqOaWueaLrOWPt+WMheijue+8jOW5tuS9v+eUqGxvZy536L6T5Ye6XG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gbiDlr7nliY1u5Liq5Y+C5pWw5L2/55So5pa55ous5Y+35YyF6KO5XG4gICAgICAgICAqIEBwYXJhbSB7Li4uYW55W119IGFyZ3MgXG4gICAgICAgICAqL1xuICAgICAgICB3KG46IG51bWJlciwgLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgICAgIGxvZy53KGxvZy5zbi5mb3JtYXQobiwgLi4uYXJncykpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlr7nliY1u5Liq5Y+C5pWw5L2/55So5pa55ous5Y+35YyF6KO577yM5bm25L2/55SobG9nLmXovpPlh7pcbiAgICAgICAgICogXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBuIOWvueWJjW7kuKrlj4LmlbDkvb/nlKjmlrnmi6zlj7fljIXoo7lcbiAgICAgICAgICogQHBhcmFtIHsuLi5hbnlbXX0gYXJncyBcbiAgICAgICAgICovXG4gICAgICAgIGUobjogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICAgICAgbG9nLmUobG9nLnNuLmZvcm1hdChuLCAuLi5hcmdzKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWvueWJjW7kuKrlj4LmlbDkvb/nlKjmlrnmi6zlj7fljIXoo7ks5bm26L+U5Zue5qC85byP5YyW5ZCO55qE57uT5p6cXG4gICAgICAgICAqIFxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gbiDlr7nliY1u5Liq5Y+C5pWw5L2/55So5pa55ous5Y+35YyF6KO5XG4gICAgICAgICAqIEBwYXJhbSB7Li4uYW55W119IGFyZ3MgXG4gICAgICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFxuICAgICAgICAgKi9cbiAgICAgICAgZm9ybWF0KG46IG51bWJlciwgLi4uYXJnczogYW55W10pOiBzdHJpbmcge1xuICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IG47IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICBhcmdzW2luZGV4XSA9IGBbJHthcmdzW2luZGV4XX1dYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhcmdzLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBzcXVhcmUx77ya566A5YyWc27nmoTkvb/nlKjvvIzlr7nnrKzkuIDkuKrlj4LmlbDkvb/nlKjmlrnmi6zlj7fljIXoo7novpPlh7pcbiAgICAgKi9cbiAgICBzMToge1xuICAgICAgICBsKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICBsb2cuc24ubCgxLCAuLi5hcmdzKTtcbiAgICAgICAgfSxcblxuICAgICAgICB3KC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICBsb2cuc24udygxLCAuLi5hcmdzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBlKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICBsb2cuc24uZSgxLCAuLi5hcmdzKTtcbiAgICAgICAgfSxcbiAgICAgICAgZm9ybWF0KC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9nLnNuLmZvcm1hdCgxLCAuLi5hcmdzKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBzcXVhcmUy77ya566A5YyWc27nmoTkvb/nlKjvvIzlr7nliY3kuKTkuKrlj4LmlbDkvb/nlKjmlrnmi6zlj7fljIXoo7novpPlh7pcbiAgICAgKi9cbiAgICBzMjoge1xuICAgICAgICBsKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICBsb2cuc24ubCgyLCAuLi5hcmdzKTtcbiAgICAgICAgfSxcblxuICAgICAgICB3KC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICBsb2cuc24udygyLCAuLi5hcmdzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBlKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICBsb2cuc24uZSgyLCAuLi5hcmdzKTtcbiAgICAgICAgfSxcbiAgICAgICAgZm9ybWF0KC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9nLnNuLmZvcm1hdCgyLCAuLi5hcmdzKTtcbiAgICAgICAgfVxuICAgIH1cbn07Il19
