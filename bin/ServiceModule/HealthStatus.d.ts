/**
 * Docker 容器健康检查的返回值
 *
 * @export
 * @enum {number}
 */
export declare enum HealthStatus {
    /**
     * 这个服务是健康的，可以使用
     */
    success = 0,
    /**
     * 这个服务现在不能正常工作了
     */
    unhealthy = 1,
}
