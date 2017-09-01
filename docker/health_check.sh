#!/bin/sh

# 查询健康检查结果
result=$(curl -s --no-buffer -XGET --unix-socket /tmp/service_starter_health_checking.sock http://1)
echo $result

if [ "$result" = "stopped" -o "$result" = "running" -o "$result" = "starting" -o "$result" = "stopping" ]; then
    exit 0
else
    exit 1
fi