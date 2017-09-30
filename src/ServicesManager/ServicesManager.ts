import events = require('events');
import http = require('http');
import fs = require('fs-extra');

import { RegisteredService } from '../RegisteredService/RegisteredService';
import { log } from '../Log';
import { ServiceModule } from "../ServiceModule/ServiceModule";
import { ServicesManagerConfig } from "./ServicesManagerConfig";
import { RunningStatus } from "../RunningStatus";

/**
 * 服务管理器
 * 
 * @export
 * @class ServicesManager
 * @extends {events.EventEmitter}
 */
export class ServicesManager extends events.EventEmitter {


    constructor(private readonly _config: ServicesManagerConfig = {}) {
        super();



    

        //配置健康检查服务
        if (_config.startHealthChecking !== false) {
            //要被监听的端口
            const port = "/tmp/service_starter_health_checking.sock";

            //删除之前的端口，避免被占用
            fs.removeSync(port);

            http.createServer(async (req, res) => {
            
            }).listen(port, (err: Error) => {
                if (err) {
                    log.s1.e('ServicesManager', '健康检查服务器启动失败：', err);
                    process.exit(1);
                }
            });
        }
    }





}