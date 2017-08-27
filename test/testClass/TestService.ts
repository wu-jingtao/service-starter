import { ServiceModule, log } from "../../bin/index";

export class TestService1 extends ServiceModule {

    async onStart(): Promise<void> {
        log.l(this.name);
    }
}

export class TestService2 extends ServiceModule {

    public get name(): string {
        return '测试类2';
    }

    interval: NodeJS.Timer;

    async onStart(): Promise<void> {
        log.l(this.name);
        this.interval = setInterval(() => {
            //什么都不做只是为了让程序不立即退出
        }, 1000);
    }
    
    async onStop() {
        log.l('停止', this.name);
        clearInterval(this.interval);
    }
}