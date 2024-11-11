# service-starter

标准化 `JavaScript` 程序体系结构，提供了一种通用的启动和关闭程序的方式，兼容 `Docker`，使用 `Typescript` 编写。

## 安装

```
npm i service-starter && npm i @types/component-emitter -D
```

## 程序结构

一个程序是由一个 `ModuleManager` 和多个 `Module` 所组成。

### [ModuleManager](./src/base/ModuleManager.ts)

* 按照模块注册的先后顺序来启动程序
* 按照模块注册的相反顺序来关闭程序
* 处理程序未捕获异常（发生异常后，从后向前停止模块，退出程序）
* 处理系统退出信号，收到退出信号后，从后向前停止模块，退出程序
* 响应 `Docker` 的健康检查

### [Module](./src/base/Module.ts)

规范了一个服务模块的基本结构

## [示例代码](./test/index.test.ts)

```js
// 创建模块管理器（如果你有用 Docker 就使用 DockerModuleManager，它额外提供了 http 健康检查服务器）
const manager = new NodeModuleManager(options);

// 创建模块（每个模块都需要继承 Module 类，并覆写里面的 onStart、onStop、onHealthCheck、onError 函数）
const module1 = TestModule1();
const module2 = TestModule2();
const module3 = TestModule3();

// 注册模块
manager.registerModule(module1);
manager.registerModule(module2);
manager.registerModule(module3);

// 按照注册顺序启动每个模块
var exceptions: void | { module?: Module; error: Error }[] = await manager.start();

// 按照注册相反顺序关闭每个模块
var exceptions: void | { module?: Module; error: Error }[] = await manager.stop();

// 调用每个模块的健康检查函数
var exception: void | { module?: Module; error: Error } =  await manager.healthCheck();

// 监听程序启动成功
manager.on(event: 'started', listener: () => { });

// 监听程序关闭成功
manager.on(event: 'stopped', listener: (exitCode: number) => { });

// 监听模块出现未处理错误
manager.on(event: 'error', listener: (error: Error, module: Module) => { });

// 监听健康检查出现异常
manager.on(event: 'unhealthy', listener: (error: Error, module: Module) => { });

// 监听程序出现了未捕获异常
manager.on(event: 'unhandledError', listener: (error: Error) => { });
```

### dockerfile

示例模板

```dockerfile
# 确保容器安装的有 curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
	&& rm -rf /var/lib/apt/lists/*

HEALTHCHECK \
    # 每次检查的间隔时间
    --interval=1m \
    # 单次检查的超时时长
    --timeout=30s \
    # 程序启动所需的最长启动时间，在此期间内检查失败不会被判定为 unhealthy
    --start-period=10m \
    # 连续多少次检查失败可判定该程序是 unhealthy
    --retries=3 \
    # 健康检查端口默认暴露在 8000
    CMD curl -f http://localhost:8000
```
