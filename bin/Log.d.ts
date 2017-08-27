/**
 * 用于标准化命令行输出的格式
 */
declare const Log: {
    l(...args: any[]): void;
    w(...args: any[]): void;
    e(...args: any[]): void;
};
export default Log;
