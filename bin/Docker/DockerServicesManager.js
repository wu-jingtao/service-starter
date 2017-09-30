"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NodeServicesManager_1 = require("./../Node/NodeServicesManager");
const http = require("http");
const fs = require("fs-extra");
const log_formatter_1 = require("log-formatter");
/**
 * NodeServicesManager的基础上添加的功docker进行健康检查的服务器。
 * 服务器监听在 /tmp/service_starter_health_checking.sock
 *
 * @export
 * @class DockerServicesManager
 * @extends {NodeServicesManager}
 */
class DockerServicesManager extends NodeServicesManager_1.NodeServicesManager {
    constructor(_config = {}) {
        super(_config);
        if (_config.startHealthChecking !== false) {
            //要被监听的端口
            const port = "/tmp/service_starter_health_checking.sock";
            //删除之前的端口，避免被占用
            fs.removeSync(port);
            //创建服务器
            const server = http.createServer(async (req, res) => {
                const result = await this.healthCheck();
                res.end(result.description);
            });
            server.once('error', err => {
                log_formatter_1.default.error
                    .location.white
                    .title.red
                    .content.red('DockerServicesManager', '健康检查服务器出现异常', err);
                server.close();
                this.stop(1);
            });
            server.listen(port);
        }
    }
}
exports.DockerServicesManager = DockerServicesManager;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkRvY2tlci9Eb2NrZXJTZXJ2aWNlc01hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSx1RUFBb0U7QUFDcEUsNkJBQThCO0FBQzlCLCtCQUFnQztBQUNoQyxpREFBZ0M7QUFHaEM7Ozs7Ozs7R0FPRztBQUNILDJCQUFtQyxTQUFRLHlDQUFtQjtJQUMxRCxZQUFZLFVBQXVDLEVBQUU7UUFDakQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWYsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLG1CQUFtQixLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDeEMsU0FBUztZQUNULE1BQU0sSUFBSSxHQUFHLDJDQUEyQyxDQUFDO1lBRXpELGVBQWU7WUFDZixFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXBCLE9BQU87WUFDUCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRztnQkFDNUMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3hDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hDLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRztnQkFDcEIsdUJBQUcsQ0FBQyxLQUFLO3FCQUNKLFFBQVEsQ0FBQyxLQUFLO3FCQUNkLEtBQUssQ0FBQyxHQUFHO3FCQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLEVBQUUsYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUU5RCxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQixDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEIsQ0FBQztJQUNMLENBQUM7Q0FDSjtBQTlCRCxzREE4QkMiLCJmaWxlIjoiRG9ja2VyL0RvY2tlclNlcnZpY2VzTWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERvY2tlclNlcnZpY2VzTWFuYWdlckNvbmZpZyB9IGZyb20gJy4vRG9ja2VyU2VydmljZXNNYW5hZ2VyQ29uZmlnJztcclxuaW1wb3J0IHsgTm9kZVNlcnZpY2VzTWFuYWdlciB9IGZyb20gJy4vLi4vTm9kZS9Ob2RlU2VydmljZXNNYW5hZ2VyJztcclxuaW1wb3J0IGh0dHAgPSByZXF1aXJlKCdodHRwJyk7XHJcbmltcG9ydCBmcyA9IHJlcXVpcmUoJ2ZzLWV4dHJhJyk7XHJcbmltcG9ydCBsb2cgZnJvbSAnbG9nLWZvcm1hdHRlcic7XHJcblxyXG5cclxuLyoqXHJcbiAqIE5vZGVTZXJ2aWNlc01hbmFnZXLnmoTln7rnoYDkuIrmt7vliqDnmoTlip9kb2NrZXLov5vooYzlgaXlurfmo4Dmn6XnmoTmnI3liqHlmajjgIIgICAgXHJcbiAqIOacjeWKoeWZqOebkeWQrOWcqCAvdG1wL3NlcnZpY2Vfc3RhcnRlcl9oZWFsdGhfY2hlY2tpbmcuc29ja1xyXG4gKiBcclxuICogQGV4cG9ydFxyXG4gKiBAY2xhc3MgRG9ja2VyU2VydmljZXNNYW5hZ2VyXHJcbiAqIEBleHRlbmRzIHtOb2RlU2VydmljZXNNYW5hZ2VyfVxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIERvY2tlclNlcnZpY2VzTWFuYWdlciBleHRlbmRzIE5vZGVTZXJ2aWNlc01hbmFnZXIge1xyXG4gICAgY29uc3RydWN0b3IoX2NvbmZpZzogRG9ja2VyU2VydmljZXNNYW5hZ2VyQ29uZmlnID0ge30pIHtcclxuICAgICAgICBzdXBlcihfY29uZmlnKTtcclxuXHJcbiAgICAgICAgaWYgKF9jb25maWcuc3RhcnRIZWFsdGhDaGVja2luZyAhPT0gZmFsc2UpIHsgLy/phY3nva7lgaXlurfmo4Dmn6XmnI3liqFcclxuICAgICAgICAgICAgLy/opoHooqvnm5HlkKznmoTnq6/lj6NcclxuICAgICAgICAgICAgY29uc3QgcG9ydCA9IFwiL3RtcC9zZXJ2aWNlX3N0YXJ0ZXJfaGVhbHRoX2NoZWNraW5nLnNvY2tcIjtcclxuXHJcbiAgICAgICAgICAgIC8v5Yig6Zmk5LmL5YmN55qE56uv5Y+j77yM6YG/5YWN6KKr5Y2g55SoXHJcbiAgICAgICAgICAgIGZzLnJlbW92ZVN5bmMocG9ydCk7XHJcblxyXG4gICAgICAgICAgICAvL+WIm+W7uuacjeWKoeWZqFxyXG4gICAgICAgICAgICBjb25zdCBzZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcihhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuaGVhbHRoQ2hlY2soKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQocmVzdWx0LmRlc2NyaXB0aW9uKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBzZXJ2ZXIub25jZSgnZXJyb3InLCBlcnIgPT4ge1xyXG4gICAgICAgICAgICAgICAgbG9nLmVycm9yXHJcbiAgICAgICAgICAgICAgICAgICAgLmxvY2F0aW9uLndoaXRlXHJcbiAgICAgICAgICAgICAgICAgICAgLnRpdGxlLnJlZFxyXG4gICAgICAgICAgICAgICAgICAgIC5jb250ZW50LnJlZCgnRG9ja2VyU2VydmljZXNNYW5hZ2VyJywgJ+WBpeW6t+ajgOafpeacjeWKoeWZqOWHuueOsOW8guW4uCcsIGVycik7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VydmVyLmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3AoMSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgc2VydmVyLmxpc3Rlbihwb3J0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iXX0=
