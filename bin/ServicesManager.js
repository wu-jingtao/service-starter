"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Log_1 = require("./Log");
const events = require("events");
const http = require("http");
/**
 * 保存注册了的服务
 *
 * @class _Services
 */
class _Services {
    constructor(service) {
        /**
         * 服务是否已启动
         *
         * @type {boolean}
         * @memberof _Services
         */
        this.isStarted = false;
        this.service = service;
        this.name = service.name;
    }
}
class ServicesManager extends events.EventEmitter {
    constructor(config = {}) {
        super();
        this._isStarted = false; //是否已经启动
        this._services = []; //注册的服务
        if (ServicesManager._servicesManagerCreated)
            throw new Error('ServicesManager已经被创建了');
        ServicesManager._servicesManagerCreated = true;
        process.on('unhandledRejection', (err) => {
            Log_1.default.e('程序出现未捕捉Promise异常', err);
            if (config.stopOnHaveUnhandledRejection !== false) {
                this.stop();
            }
        });
        process.on('uncaughtException', (err) => {
            Log_1.default.e('程序出现未捕捉异常', err);
            if (config.stopOnHaveUncaughtException !== false) {
                this.stop();
            }
        });
        process.on('SIGTERM', () => {
            if (config.stopOnHaveSIGTERM !== false) {
                this.stop();
            }
        });
        process.on('SIGINT', () => {
            if (config.stopOnHaveSIGINT !== false) {
                this.stop();
            }
        });
        if (config.startHealthChecking !== false) {
            http.createServer((req, res) => {
                Log_1.default.l('接受到健康检查请求');
                res.end(0);
            }).listen("/app/health_checking.sock", (err) => {
                Log_1.default.e('服务健康检查启动失败：', err);
                process.exit(1);
            });
        }
    }
    /**
     * 启动所有注册的服务。按照注册的先后顺序来启动服务。先注册的服务先启动。
     * 如果启动过程中某个服务出现异常，则后面的服务则不再被启动，之前启动过了的服务也会被依次关闭（按照从后向前的顺序）。
     * 启动结束后会触发started事件
     *
     * @memberof ServicesManager
     */
    start() {
        if (this._isStarted === false) {
            Log_1.default.l('开始启动服务');
            this._isStarted = true;
            (async () => {
                for (let item of this._services) {
                    try {
                        item.isStarted = true;
                        await item.service.onStart();
                        //绑定错误处理器
                        item.service.on('error', item.errorListener);
                        Log_1.default.l(item.name, '[启动成功]');
                    }
                    catch (error) {
                        Log_1.default.e('启动', item.name, '时出现异常：', error);
                        this.stop();
                        return;
                    }
                }
                Log_1.default.l('所有服务已启动');
                this.emit('started');
            })();
        }
    }
    /**
     * 关闭所有已启动的服务。先注册的服务最后被关闭。当所有服务都被关闭后程序将会被退出。
     * 当所有服务都停止后出发stopped事件
     *
     * @memberof ServicesManager
     */
    stop() {
        if (this._isStarted === true) {
            Log_1.default.l('开始停止服务');
            this._isStarted = false;
            (async () => {
                for (let item of this._services.reverse()) {
                    if (item.isStarted) {
                        try {
                            item.isStarted = false;
                            await item.service.onStop();
                            //清除绑定的错误监听器
                            item.service.removeListener('error', item.errorListener);
                            Log_1.default.l(item.name, '[停止成功]');
                        }
                        catch (error) {
                            Log_1.default.w('停止', item.name, '时出现异常：', error);
                        }
                    }
                }
                Log_1.default.l('所有服务已停止');
                this.emit('stopped');
            })();
        }
    }
    /**
     * 注册服务
     *
     * @param {ServiceModule} serviceModule 服务模块实例
     * @memberof ServicesManager
     */
    registerService(serviceModule) {
        if (this._services.some(item => item.name == serviceModule.name)) {
            throw new Error(`服务'${serviceModule.name}'已注册过了`);
        }
        else {
            const service = new _Services(serviceModule);
            //创建服务运行时错误监听器
            service.errorListener = (err) => {
                const value = service.service.onError(err);
                switch (value) {
                    case false:
                        this.onError(err, serviceModule);
                        break;
                    case true:
                        break;
                    case 'stop':
                        this.onError(err, serviceModule);
                        this.stop();
                        break;
                    default:
                        if (value instanceof Error)
                            this.onError(value, serviceModule);
                        break;
                }
            };
            this._services.push(service);
        }
    }
    /**
     * 服务运行过程中的错误处理方法。服务启动或关闭过程中产生的错误不会触发该方法。
     *
     * @param {Error} err
     * @param {ServiceModule} service 发生错误的服务实例
     * @memberof ServicesManager
     */
    onError(err, service) {
        Log_1.default.e(service.name, '发生错误：', err);
    }
}
ServicesManager._servicesManagerCreated = false; //ServicesManager是否已经创建了（一个进程只允许创建一个ServicesManager）
exports.default = ServicesManager;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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OlsiaW1wb3J0IGxvZyBmcm9tICcuL0xvZyc7XHJcbmltcG9ydCBldmVudHMgPSByZXF1aXJlKCdldmVudHMnKTtcclxuaW1wb3J0IFNlcnZpY2VNb2R1bGUgZnJvbSBcIi4vU2VydmljZU1vZHVsZVwiO1xyXG5pbXBvcnQgaHR0cCA9IHJlcXVpcmUoJ2h0dHAnKTtcclxuXHJcbi8qKlxyXG4gKiBTZXJ2aWNlc01hbmFnZXLphY3nva5cclxuICogXHJcbiAqIEBleHBvcnRcclxuICogQGludGVyZmFjZSBTZXJ2aWNlc01hbmFnZXJDb25maWdcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2VydmljZXNNYW5hZ2VyQ29uZmlnIHtcclxuICAgIC8qKlxyXG4gICAgICog5b2T5pyJ5pyq5o2V6I635byC5bi455qEUHJvbWlzZeS6p+eUn+aXtuaYr+WQpuWBnOatouacjeWKoSjpu5jorqR0cnVlLOWBnOatoilcclxuICAgICAqIFxyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyQ29uZmlnXHJcbiAgICAgKi9cclxuICAgIHN0b3BPbkhhdmVVbmhhbmRsZWRSZWplY3Rpb24/OiBib29sZWFuO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog5b2T5pyJ5pyq5o2V6I635byC5bi45Lqn55Sf5pe25piv5ZCm5YGc5q2i5pyN5YqhKOm7mOiupHRydWUs5YGc5q2iKVxyXG4gICAgICogXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqIEBtZW1iZXJvZiBTZXJ2aWNlc01hbmFnZXJDb25maWdcclxuICAgICAqL1xyXG4gICAgc3RvcE9uSGF2ZVVuY2F1Z2h0RXhjZXB0aW9uPzogYm9vbGVhbjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOW9k+aUtuWIsFNJR1RFUk3kv6Hlj7fml7bmmK/lkKblgZzmraLmnI3liqEo6buY6K6kdHJ1ZSzlgZzmraIpXHJcbiAgICAgKiBcclxuICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlckNvbmZpZ1xyXG4gICAgICovXHJcbiAgICBzdG9wT25IYXZlU0lHVEVSTT86IGJvb2xlYW47XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIOW9k+aUtuWIsFNJR0lOVOS/oeWPt+aXtuaYr+WQpuWBnOatouacjeWKoSjpu5jorqR0cnVlLOWBnOatoilcclxuICAgICogXHJcbiAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyQ29uZmlnXHJcbiAgICAqL1xyXG4gICAgc3RvcE9uSGF2ZVNJR0lOVD86IGJvb2xlYW47XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmmK/lkKblkK/liqjlgaXlurfmo4Dmn6Uo6buY6K6kdHJ1ZSzlkK/liqgpXHJcbiAgICAgKiBcclxuICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICogQG1lbWJlcm9mIFNlcnZpY2VzTWFuYWdlckNvbmZpZ1xyXG4gICAgICovXHJcbiAgICBzdGFydEhlYWx0aENoZWNraW5nPzogYm9vbGVhbjtcclxufVxyXG5cclxuLyoqXHJcbiAqIOS/neWtmOazqOWGjOS6hueahOacjeWKoVxyXG4gKiBcclxuICogQGNsYXNzIF9TZXJ2aWNlc1xyXG4gKi9cclxuY2xhc3MgX1NlcnZpY2VzIHtcclxuICAgIC8qKlxyXG4gICAgICog5pyN5Yqh5a6e5L6LXHJcbiAgICAgKiBcclxuICAgICAqIEB0eXBlIHtTZXJ2aWNlTW9kdWxlfVxyXG4gICAgICogQG1lbWJlcm9mIF9TZXJ2aWNlc1xyXG4gICAgICovXHJcbiAgICByZWFkb25seSBzZXJ2aWNlOiBTZXJ2aWNlTW9kdWxlO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog5pyN5Yqh5piv5ZCm5bey5ZCv5YqoXHJcbiAgICAgKiBcclxuICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICogQG1lbWJlcm9mIF9TZXJ2aWNlc1xyXG4gICAgICovXHJcbiAgICBpc1N0YXJ0ZWQgPSBmYWxzZTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOacjeWKoeeahOWQjeensOOAgu+8iOi/memHjOWGjeS/neWtmOS4gOasoeacjeWKoeeahOWQjeensOaYr+WboOS4uuS4jeWFgeiuuOacjeWKoeWQjeensOWcqOi/kOihjOi/h+eoi+S4reiiq+aUueWPmO+8iVxyXG4gICAgICogXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICogQG1lbWJlcm9mIF9TZXJ2aWNlc1xyXG4gICAgICovXHJcbiAgICByZWFkb25seSBuYW1lOiBzdHJpbmc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDnu5HlrprlnKjmnI3liqHkuIrnmoTplJnor6/nm5HlkKzlmajjgILnlKjkuo7kuYvlkI7liKDpmaTnm5HlkKzlmajml7bkvb/nlKhcclxuICAgICAqIFxyXG4gICAgICogQHR5cGUge0Z1bmN0aW9ufVxyXG4gICAgICogQG1lbWJlcm9mIF9TZXJ2aWNlc1xyXG4gICAgICovXHJcbiAgICBlcnJvckxpc3RlbmVyOiBGdW5jdGlvbjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihzZXJ2aWNlOiBTZXJ2aWNlTW9kdWxlKSB7XHJcbiAgICAgICAgdGhpcy5zZXJ2aWNlID0gc2VydmljZTtcclxuICAgICAgICB0aGlzLm5hbWUgPSBzZXJ2aWNlLm5hbWU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNlcnZpY2VzTWFuYWdlciBleHRlbmRzIGV2ZW50cy5FdmVudEVtaXR0ZXIge1xyXG5cclxuICAgIHByaXZhdGUgX2lzU3RhcnRlZCA9IGZhbHNlOyAgICAvL+aYr+WQpuW3sue7j+WQr+WKqFxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX3NlcnZpY2VzTWFuYWdlckNyZWF0ZWQgPSBmYWxzZTsgLy9TZXJ2aWNlc01hbmFnZXLmmK/lkKblt7Lnu4/liJvlu7rkuobvvIjkuIDkuKrov5vnqIvlj6rlhYHorrjliJvlu7rkuIDkuKpTZXJ2aWNlc01hbmFnZXLvvIlcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX3NlcnZpY2VzOiBfU2VydmljZXNbXSA9IFtdOyAgIC8v5rOo5YaM55qE5pyN5YqhXHJcblxyXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBTZXJ2aWNlc01hbmFnZXJDb25maWcgPSB7fSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgIGlmIChTZXJ2aWNlc01hbmFnZXIuX3NlcnZpY2VzTWFuYWdlckNyZWF0ZWQpIHRocm93IG5ldyBFcnJvcignU2VydmljZXNNYW5hZ2Vy5bey57uP6KKr5Yib5bu65LqGJyk7XHJcbiAgICAgICAgU2VydmljZXNNYW5hZ2VyLl9zZXJ2aWNlc01hbmFnZXJDcmVhdGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgcHJvY2Vzcy5vbigndW5oYW5kbGVkUmVqZWN0aW9uJywgKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgbG9nLmUoJ+eoi+W6j+WHuueOsOacquaNleaNiVByb21pc2XlvILluLgnLCBlcnIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlVW5oYW5kbGVkUmVqZWN0aW9uICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcHJvY2Vzcy5vbigndW5jYXVnaHRFeGNlcHRpb24nLCAoZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICBsb2cuZSgn56iL5bqP5Ye6546w5pyq5o2V5o2J5byC5bi4JywgZXJyKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjb25maWcuc3RvcE9uSGF2ZVVuY2F1Z2h0RXhjZXB0aW9uICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcHJvY2Vzcy5vbignU0lHVEVSTScsICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlU0lHVEVSTSAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHByb2Nlc3Mub24oJ1NJR0lOVCcsICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKGNvbmZpZy5zdG9wT25IYXZlU0lHSU5UICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKGNvbmZpZy5zdGFydEhlYWx0aENoZWNraW5nICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICBodHRwLmNyZWF0ZVNlcnZlcigocmVxLCByZXMpID0+IHtcclxuICAgICAgICAgICAgICAgIGxvZy5sKCfmjqXlj5fliLDlgaXlurfmo4Dmn6Xor7fmsYInKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoMCk7XHJcbiAgICAgICAgICAgIH0pLmxpc3RlbihcIi9hcHAvaGVhbHRoX2NoZWNraW5nLnNvY2tcIiwgKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIGxvZy5lKCfmnI3liqHlgaXlurfmo4Dmn6XlkK/liqjlpLHotKXvvJonLCBlcnIpO1xyXG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlkK/liqjmiYDmnInms6jlhoznmoTmnI3liqHjgILmjInnhafms6jlhoznmoTlhYjlkI7pobrluo/mnaXlkK/liqjmnI3liqHjgILlhYjms6jlhoznmoTmnI3liqHlhYjlkK/liqjjgIJcclxuICAgICAqIOWmguaenOWQr+WKqOi/h+eoi+S4reafkOS4quacjeWKoeWHuueOsOW8guW4uO+8jOWImeWQjumdoueahOacjeWKoeWImeS4jeWGjeiiq+WQr+WKqO+8jOS5i+WJjeWQr+WKqOi/h+S6hueahOacjeWKoeS5n+S8muiiq+S+neasoeWFs+mXre+8iOaMieeFp+S7juWQjuWQkeWJjeeahOmhuuW6j++8ieOAglxyXG4gICAgICog5ZCv5Yqo57uT5p2f5ZCO5Lya6Kem5Y+Rc3RhcnRlZOS6i+S7tlxyXG4gICAgICogXHJcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHN0YXJ0KCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9pc1N0YXJ0ZWQgPT09IGZhbHNlKSB7XHJcblxyXG4gICAgICAgICAgICBsb2cubCgn5byA5aeL5ZCv5Yqo5pyN5YqhJyk7XHJcbiAgICAgICAgICAgIHRoaXMuX2lzU3RhcnRlZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLl9zZXJ2aWNlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uaXNTdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgaXRlbS5zZXJ2aWNlLm9uU3RhcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy/nu5HlrprplJnor6/lpITnkIblmahcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5zZXJ2aWNlLm9uKCdlcnJvcicsIGl0ZW0uZXJyb3JMaXN0ZW5lcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZy5sKGl0ZW0ubmFtZSwgJ1vlkK/liqjmiJDlip9dJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nLmUoJ+WQr+WKqCcsIGl0ZW0ubmFtZSwgJ+aXtuWHuueOsOW8guW4uO+8micsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbG9nLmwoJ+aJgOacieacjeWKoeW3suWQr+WKqCcpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdzdGFydGVkJyk7XHJcbiAgICAgICAgICAgIH0pKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5YWz6Zet5omA5pyJ5bey5ZCv5Yqo55qE5pyN5Yqh44CC5YWI5rOo5YaM55qE5pyN5Yqh5pyA5ZCO6KKr5YWz6Zet44CC5b2T5omA5pyJ5pyN5Yqh6YO96KKr5YWz6Zet5ZCO56iL5bqP5bCG5Lya6KKr6YCA5Ye644CCXHJcbiAgICAgKiDlvZPmiYDmnInmnI3liqHpg73lgZzmraLlkI7lh7rlj5FzdG9wcGVk5LqL5Lu2XHJcbiAgICAgKiBcclxuICAgICAqIEBtZW1iZXJvZiBTZXJ2aWNlc01hbmFnZXJcclxuICAgICAqL1xyXG4gICAgc3RvcCgpIHtcclxuICAgICAgICBpZiAodGhpcy5faXNTdGFydGVkID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIGxvZy5sKCflvIDlp4vlgZzmraLmnI3liqEnKTtcclxuICAgICAgICAgICAgdGhpcy5faXNTdGFydGVkID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLl9zZXJ2aWNlcy5yZXZlcnNlKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5pc1N0YXJ0ZWQpIHsgICAvL+WPquWFs+mXreW3suWQr+WKqOS6hueahOacjeWKoVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5pc1N0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGl0ZW0uc2VydmljZS5vblN0b3AoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8v5riF6Zmk57uR5a6a55qE6ZSZ6K+v55uR5ZCs5ZmoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnNlcnZpY2UucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgaXRlbS5lcnJvckxpc3RlbmVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZy5sKGl0ZW0ubmFtZSwgJ1vlgZzmraLmiJDlip9dJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2cudygn5YGc5q2iJywgaXRlbS5uYW1lLCAn5pe25Ye6546w5byC5bi477yaJywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxvZy5sKCfmiYDmnInmnI3liqHlt7LlgZzmraInKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnc3RvcHBlZCcpO1xyXG4gICAgICAgICAgICB9KSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOazqOWGjOacjeWKoVxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge1NlcnZpY2VNb2R1bGV9IHNlcnZpY2VNb2R1bGUg5pyN5Yqh5qih5Z2X5a6e5L6LXHJcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHJlZ2lzdGVyU2VydmljZShzZXJ2aWNlTW9kdWxlOiBTZXJ2aWNlTW9kdWxlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3NlcnZpY2VzLnNvbWUoaXRlbSA9PiBpdGVtLm5hbWUgPT0gc2VydmljZU1vZHVsZS5uYW1lKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOacjeWKoScke3NlcnZpY2VNb2R1bGUubmFtZX0n5bey5rOo5YaM6L+H5LqGYCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3Qgc2VydmljZSA9IG5ldyBfU2VydmljZXMoc2VydmljZU1vZHVsZSk7XHJcblxyXG4gICAgICAgICAgICAvL+WIm+W7uuacjeWKoei/kOihjOaXtumUmeivr+ebkeWQrOWZqFxyXG4gICAgICAgICAgICBzZXJ2aWNlLmVycm9yTGlzdGVuZXIgPSAoZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBzZXJ2aWNlLnNlcnZpY2Uub25FcnJvcihlcnIpO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgZmFsc2U6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnIsIHNlcnZpY2VNb2R1bGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIHRydWU6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0b3AnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyLCBzZXJ2aWNlTW9kdWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKHZhbHVlLCBzZXJ2aWNlTW9kdWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9zZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOacjeWKoei/kOihjOi/h+eoi+S4reeahOmUmeivr+WkhOeQhuaWueazleOAguacjeWKoeWQr+WKqOaIluWFs+mXrei/h+eoi+S4reS6p+eUn+eahOmUmeivr+S4jeS8muinpuWPkeivpeaWueazleOAglxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBlcnIgXHJcbiAgICAgKiBAcGFyYW0ge1NlcnZpY2VNb2R1bGV9IHNlcnZpY2Ug5Y+R55Sf6ZSZ6K+v55qE5pyN5Yqh5a6e5L6LXHJcbiAgICAgKiBAbWVtYmVyb2YgU2VydmljZXNNYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIG9uRXJyb3IoZXJyOiBFcnJvciwgc2VydmljZTogU2VydmljZU1vZHVsZSkge1xyXG4gICAgICAgIGxvZy5lKHNlcnZpY2UubmFtZSwgJ+WPkeeUn+mUmeivr++8micsIGVycik7XHJcbiAgICB9XHJcbn0iXX0=
