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
        if (_config.startHealthChecking !== false && process.platform === 'linux') {
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
                    .content.red(this.name, '健康检查服务器出现异常：', err);
            });
            server.listen(port);
        }
    }
}
exports.DockerServicesManager = DockerServicesManager;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkRvY2tlci9Eb2NrZXJTZXJ2aWNlc01hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSx1RUFBb0U7QUFDcEUsNkJBQThCO0FBQzlCLCtCQUFnQztBQUNoQyxpREFBZ0M7QUFHaEM7Ozs7Ozs7R0FPRztBQUNILDJCQUFtQyxTQUFRLHlDQUFtQjtJQUMxRCxZQUFZLFVBQXVDLEVBQUU7UUFDakQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWYsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLG1CQUFtQixLQUFLLEtBQUssSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDeEUsU0FBUztZQUNULE1BQU0sSUFBSSxHQUFHLDJDQUEyQyxDQUFDO1lBRXpELGVBQWU7WUFDZixFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXBCLE9BQU87WUFDUCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRztnQkFDNUMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3hDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hDLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRztnQkFDcEIsdUJBQUcsQ0FBQyxLQUFLO3FCQUNKLFFBQVEsQ0FBQyxLQUFLO3FCQUNkLEtBQUssQ0FBQyxHQUFHO3FCQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDckQsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hCLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUEzQkQsc0RBMkJDIiwiZmlsZSI6IkRvY2tlci9Eb2NrZXJTZXJ2aWNlc01hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEb2NrZXJTZXJ2aWNlc01hbmFnZXJDb25maWcgfSBmcm9tICcuL0RvY2tlclNlcnZpY2VzTWFuYWdlckNvbmZpZyc7XHJcbmltcG9ydCB7IE5vZGVTZXJ2aWNlc01hbmFnZXIgfSBmcm9tICcuLy4uL05vZGUvTm9kZVNlcnZpY2VzTWFuYWdlcic7XHJcbmltcG9ydCBodHRwID0gcmVxdWlyZSgnaHR0cCcpO1xyXG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xyXG5pbXBvcnQgbG9nIGZyb20gJ2xvZy1mb3JtYXR0ZXInO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBOb2RlU2VydmljZXNNYW5hZ2Vy55qE5Z+656GA5LiK5re75Yqg55qE5YqfZG9ja2Vy6L+b6KGM5YGl5bq35qOA5p+l55qE5pyN5Yqh5Zmo44CCICAgIFxyXG4gKiDmnI3liqHlmajnm5HlkKzlnKggL3RtcC9zZXJ2aWNlX3N0YXJ0ZXJfaGVhbHRoX2NoZWNraW5nLnNvY2tcclxuICogXHJcbiAqIEBleHBvcnRcclxuICogQGNsYXNzIERvY2tlclNlcnZpY2VzTWFuYWdlclxyXG4gKiBAZXh0ZW5kcyB7Tm9kZVNlcnZpY2VzTWFuYWdlcn1cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEb2NrZXJTZXJ2aWNlc01hbmFnZXIgZXh0ZW5kcyBOb2RlU2VydmljZXNNYW5hZ2VyIHtcclxuICAgIGNvbnN0cnVjdG9yKF9jb25maWc6IERvY2tlclNlcnZpY2VzTWFuYWdlckNvbmZpZyA9IHt9KSB7XHJcbiAgICAgICAgc3VwZXIoX2NvbmZpZyk7XHJcblxyXG4gICAgICAgIGlmIChfY29uZmlnLnN0YXJ0SGVhbHRoQ2hlY2tpbmcgIT09IGZhbHNlICYmIHByb2Nlc3MucGxhdGZvcm0gPT09ICdsaW51eCcpIHsgLy/phY3nva7lgaXlurfmo4Dmn6XmnI3liqFcclxuICAgICAgICAgICAgLy/opoHooqvnm5HlkKznmoTnq6/lj6NcclxuICAgICAgICAgICAgY29uc3QgcG9ydCA9IFwiL3RtcC9zZXJ2aWNlX3N0YXJ0ZXJfaGVhbHRoX2NoZWNraW5nLnNvY2tcIjtcclxuXHJcbiAgICAgICAgICAgIC8v5Yig6Zmk5LmL5YmN55qE56uv5Y+j77yM6YG/5YWN6KKr5Y2g55SoXHJcbiAgICAgICAgICAgIGZzLnJlbW92ZVN5bmMocG9ydCk7XHJcblxyXG4gICAgICAgICAgICAvL+WIm+W7uuacjeWKoeWZqFxyXG4gICAgICAgICAgICBjb25zdCBzZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcihhc3luYyAocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuaGVhbHRoQ2hlY2soKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQocmVzdWx0LmRlc2NyaXB0aW9uKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBzZXJ2ZXIub25jZSgnZXJyb3InLCBlcnIgPT4ge1xyXG4gICAgICAgICAgICAgICAgbG9nLmVycm9yXHJcbiAgICAgICAgICAgICAgICAgICAgLmxvY2F0aW9uLndoaXRlXHJcbiAgICAgICAgICAgICAgICAgICAgLnRpdGxlLnJlZFxyXG4gICAgICAgICAgICAgICAgICAgIC5jb250ZW50LnJlZCh0aGlzLm5hbWUsICflgaXlurfmo4Dmn6XmnI3liqHlmajlh7rnjrDlvILluLjvvJonLCBlcnIpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHNlcnZlci5saXN0ZW4ocG9ydCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59Il19
