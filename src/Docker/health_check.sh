#!/bin/sh

# 查询健康检查结果
result=$(curl --connect-timeout 30 --max-time 30 -s --no-buffer -XGET --unix-socket /tmp/service_starter_health_checking.sock http://)
echo $result

if [ "$result" = "running" -o "$result" = "stopped" -o "$result" = "starting" -o "$result" = "stopping" ]; then
    exit 0
else
    exit 1
fi