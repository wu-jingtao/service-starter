import expect = require('expect.js');
import { log } from "../bin/index";
import test from './testClass/index';
import child_process = require('child_process');

describe('开始测试ServicesManager与ServiceModule', function () {

    before(test);

    it('测试healthChecking', function (done) {
        const cmd = "curl -s --no-buffer -XGET --unix-socket /tmp/node_service_starter/health_checking.sock http://";
        child_process.exec(cmd, (err, stdout, stderr) => {
            debugger
            if (stderr.trim() != '') done(new Error('请求healthChecking接口时发生错误:' + stderr))
            else if (err) done(new Error('请求healthChecking接口时发生错误:' + err))
            else if (stdout.trim() == '0') done();
        });
    });
});