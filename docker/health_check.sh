#!/bin/sh

# 查询健康检查结果
result=$(curl -s --no-buffer -XGET --unix-socket /tmp/node_service_starter/health_checking.sock http:// || echo 1)

if [ "$result" = "0" ]; then
    exit 0
else
    exit 1
fi