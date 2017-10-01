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
                    .content.red(this.name, '健康检查服务器出现异常：', err);
            });
            server.listen(port);
        }
    }
}
exports.DockerServicesManager = DockerServicesManager;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkRvY2tlci9Eb2NrZXJTZXJ2aWNlc01hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSx1RUFBb0U7QUFDcEUsNkJBQThCO0FBQzlCLCtCQUFnQztBQUNoQyxpREFBZ0M7QUFHaEM7Ozs7Ozs7R0FPRztBQUNILDJCQUFtQyxTQUFRLHlDQUFtQjtJQUMxRCxZQUFZLFVBQXVDLEVBQUU7UUFDakQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWYsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLG1CQUFtQixLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDeEMsU0FBUztZQUNULE1BQU0sSUFBSSxHQUFHLDJDQUEyQyxDQUFDO1lBRXpELGVBQWU7WUFDZixFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXBCLE9BQU87WUFDUCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRztnQkFDNUMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3hDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hDLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRztnQkFDcEIsdUJBQUcsQ0FBQyxLQUFLO3FCQUNKLFFBQVEsQ0FBQyxLQUFLO3FCQUNkLEtBQUssQ0FBQyxHQUFHO3FCQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDckQsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hCLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUEzQkQsc0RBMkJDIiwiZmlsZSI6IkRvY2tlci9Eb2NrZXJTZXJ2aWNlc01hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEb2NrZXJTZXJ2aWNlc01hbmFnZXJDb25maWcgfSBmcm9tICcuL0RvY2tlclNlcnZpY2VzTWFuYWdlckNvbmZpZyc7XHJcbmltcG9ydCB7IE5vZGVTZXJ2aWNlc01hbmFnZXIgfSBmcm9tICcuLy4uL05vZGUvTm9kZVNlcnZpY2VzTWFuYWdlcic7XHJcbmltcG9ydCBodHRwID0gcmVxdWlyZSgnaHR0cCcpO1xyXG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xyXG5pbXBvcnQgbG9nIGZyb20gJ2xvZy1mb3JtYXR0ZXInO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBOb2RlU2VydmljZXNNYW5hZ2Vy55qE5Z+656GA5LiK5re75Yqg55qE5YqfZG9ja2Vy6L+b6KGM5YGl5bq35qOA5p+l55qE5pyN5Yqh5Zmo44CCICAgIFxyXG4gKiDmnI3liqHlmajnm5HlkKzlnKggL3RtcC9zZXJ2aWNlX3N0YXJ0ZXJfaGVhbHRoX2NoZWNraW5nLnNvY2tcclxuICogXHJcbiAqIEBleHBvcnRcclxuICogQGNsYXNzIERvY2tlclNlcnZpY2VzTWFuYWdlclxyXG4gKiBAZXh0ZW5kcyB7Tm9kZVNlcnZpY2VzTWFuYWdlcn1cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEb2NrZXJTZXJ2aWNlc01hbmFnZXIgZXh0ZW5kcyBOb2RlU2VydmljZXNNYW5hZ2VyIHtcclxuICAgIGNvbnN0cnVjdG9yKF9jb25maWc6IERvY2tlclNlcnZpY2VzTWFuYWdlckNvbmZpZyA9IHt9KSB7XHJcbiAgICAgICAgc3VwZXIoX2NvbmZpZyk7XHJcblxyXG4gICAgICAgIGlmIChfY29uZmlnLnN0YXJ0SGVhbHRoQ2hlY2tpbmcgIT09IGZhbHNlKSB7IC8v6YWN572u5YGl5bq35qOA5p+l5pyN5YqhXHJcbiAgICAgICAgICAgIC8v6KaB6KKr55uR5ZCs55qE56uv5Y+jXHJcbiAgICAgICAgICAgIGNvbnN0IHBvcnQgPSBcIi90bXAvc2VydmljZV9zdGFydGVyX2hlYWx0aF9jaGVja2luZy5zb2NrXCI7XHJcblxyXG4gICAgICAgICAgICAvL+WIoOmZpOS5i+WJjeeahOerr+WPo++8jOmBv+WFjeiiq+WNoOeUqFxyXG4gICAgICAgICAgICBmcy5yZW1vdmVTeW5jKHBvcnQpO1xyXG5cclxuICAgICAgICAgICAgLy/liJvlu7rmnI3liqHlmahcclxuICAgICAgICAgICAgY29uc3Qgc2VydmVyID0gaHR0cC5jcmVhdGVTZXJ2ZXIoYXN5bmMgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmhlYWx0aENoZWNrKCk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKHJlc3VsdC5kZXNjcmlwdGlvbik7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgc2VydmVyLm9uY2UoJ2Vycm9yJywgZXJyID0+IHtcclxuICAgICAgICAgICAgICAgIGxvZy5lcnJvclxyXG4gICAgICAgICAgICAgICAgICAgIC5sb2NhdGlvbi53aGl0ZVxyXG4gICAgICAgICAgICAgICAgICAgIC50aXRsZS5yZWRcclxuICAgICAgICAgICAgICAgICAgICAuY29udGVudC5yZWQodGhpcy5uYW1lLCAn5YGl5bq35qOA5p+l5pyN5Yqh5Zmo5Ye6546w5byC5bi477yaJywgZXJyKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBzZXJ2ZXIubGlzdGVuKHBvcnQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSJdfQ==
