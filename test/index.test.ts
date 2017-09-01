import expect = require('expect.js');
import { ServicesManager, log } from "../bin/index";
import child_process = require('child_process');
import path = require('path');

import { TestService1, TestService2 } from "./testClass/TestService";

describe('开始测试ServicesManager与ServiceModule', function () {

    let sm: ServicesManager;

    before(function () {
        sm = new ServicesManager({ exitAfterStopped: false });
        sm.registerService(new TestService1);
        sm.registerService(new TestService2);
    });

    it('测试启动服务', function (done) {
        sm.start();
        sm.once('started', done);
    });

    it('第一次测试healthChecking', function (done) {
        this.timeout(10000);

        const cmd = path.resolve(__dirname, '../docker/health_check.sh');
        const ps = child_process.spawn(cmd);

        ps.stdout.once('data', (data) => {
            if (data.toString().trim() != 'running') {
                done(new Error('healthChecking的内部处理逻辑存在问题，第一次请求应当返回running，而实际返回了' + data));
            }
        });

        ps.stderr.once('data', (data) => {
            if (data.toString().trim() != '') {
                done(new Error('执行health_check.sh时发生错误:' + data));
            }
        });

        ps.once('close', (code) => {
            if (code != 0) {
                done(new Error('health_check.sh执行后返回的状态码不为0。实际返回的是：' + code));
            } else {
                done()
            }
        });
    });

    it('第二次测试healthChecking', function (done) {
        this.timeout(10000);

        log.l('接下来显示一个错误才是正确的');

        const cmd = path.resolve(__dirname, '../docker/health_check.sh');
        setTimeout(() => {
            const ps = child_process.spawn(cmd);

            ps.stdout.once('data', (data) => {
                if (data.toString().trim() == 'running') {
                    done(new Error('healthChecking的内部处理逻辑存在问题，第二次请求应当报错，而实际返回了' + data));
                }
            });

            ps.stderr.once('data', (data) => {
                if (data.toString().trim() != '') {
                    done(new Error('执行health_check.sh时发生错误:' + data));
                }
            });

            ps.once('close', (code) => {
                if (code != 1) {
                    done(new Error('health_check.sh执行后返回的状态码不为1。实际返回的是：' + code));
                } else {
                    done()
                }
            });
        }, 5000);
    });

    it('测试停止服务', function (done) {
        sm.stop();
        sm.once('stopped', done);
    });
});