import expect = require('expect.js');
import { ServicesManager } from "../bin/index";
import child_process = require('child_process');

import { TestService1, TestService2 } from "./testClass/TestService";

describe('开始测试ServicesManager与ServiceModule', function () {

    let sm: ServicesManager;

    before(function () {
        sm = new ServicesManager();
        sm.registerService(new TestService1);
        sm.registerService(new TestService2);
    });

    it('测试启动服务', function (done) {
        sm.start();
        sm.once('started', done);
    });

    it('测试healthChecking', function (done) {
        this.timeout(10000);
        
        const cmd = "curl -s --no-buffer -XGET --unix-socket /tmp/service_starter_health_checking.sock http://";
        
        child_process.exec(cmd, (err, stdout, stderr) => {
            if (stderr.trim() != '') done(new Error('请求healthChecking接口时发生错误:' + stderr))
            else if (err) done(new Error('请求healthChecking接口时发生错误:' + err))
            else if (stdout.trim() != '0') done(new Error('healthChecking的内部处理逻辑存在问题，第一次请求应当返回0，而实际返回了' + stdout));
        });

        //启动3秒后TestService2的状态会变为unhealthy，TestService1保持不变。
        setTimeout(() => {
            child_process.exec(cmd, (err, stdout, stderr) => {
                if (stderr.trim() != '') done(new Error('请求healthChecking接口时发生错误:' + stderr))
                else if (err) done(new Error('请求healthChecking接口时发生错误:' + err))
                else if (stdout.trim() != '1') done(new Error('healthChecking的内部处理逻辑存在问题，第二次请求应当返回1，而实际返回了' + stdout));
                else done();
            });
        }, 5000);
    });

    it('测试停止服务', function (done) {
        sm.stop();
        sm.once('stopped', done);
    });
});