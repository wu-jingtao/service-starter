# 如果容器还缺少curl，那么还需要安装curl(注意curl版本必须大于7.4 不然没有--unix-socket参数)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
	&& rm -rf /var/lib/apt/lists/*

# 确保可执行
RUN chmod 755 /程序所在目录/node_modules/service-starter/health_check.sh

HEALTHCHECK \
    # 每次检查的间隔时间
    --interval=1m \
    # 单次检查的超时时长
    --timeout=30s \
    # 这个可以理解为在开始正式检查之前容器所需要的启动时间
    --start-period=1m \
    # 连续多少次检查失败可判定该服务是unhealthy
    --retries=3 \
    # 调用程序所暴露出的健康检查接口(要使用绝对路径)
    CMD /程序所在目录/node_modules/service-starter/health_check.sh
