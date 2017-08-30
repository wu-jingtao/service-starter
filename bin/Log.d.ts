/// <reference types="chalk" />
import chalk = require('chalk');
/**
 * 用于标准化命令行输出的格式
 */
export declare const log: {
    chalk: typeof chalk;
    l(...args: any[]): void;
    w(...args: any[]): void;
    e(...args: any[]): void;
    sn: {
        l(n: number, ...args: any[]): void;
        w(n: number, ...args: any[]): void;
        e(n: number, ...args: any[]): void;
        format(n: number, ...args: any[]): string;
    };
    s1: {
        l(...args: any[]): void;
        w(...args: any[]): void;
        e(...args: any[]): void;
        format(...args: any[]): string;
    };
    s2: {
        l(...args: any[]): void;
        w(...args: any[]): void;
        e(...args: any[]): void;
        format(...args: any[]): string;
    };
};
