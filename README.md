# service-starter
标准化nodejs程序的结构体系。提供一个通用的启动和关闭程序的方式。兼容Docker。

## 程序结构
一个容器是有一个`ServicesManager`和多个`ServiceModule`所组成的。
### ServicesManager
一个容器之中只能允许实例化一个`ServicesManager`（[API](bin/ServicesManager.d.ts)）。该类负责
* 按照服务注册的顺序来启动服务
* 响应容器的健康检查
* 按照已服务注册相反的顺序来关闭服务
* 打印服务启动和关闭的过程
* 优雅处理程序未捕获异常（发生异常后，先依次停止服务，再退出程序）
* 处理系统退出信号，收到退出信号后，先依次停止服务，再退出程序
* 提供了onError回调，用户可以自定义运行时错误处理方式
### ServiceModule
规范了一个服务的基本结构（[API](bin/ServiceModule.d.ts)）

### docker
在项目docker文件夹下提供了一个[Dockerfile](docker/Dockerfile)基础配置模板
