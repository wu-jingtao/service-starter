import { ServiceModule, log } from "../../bin/index";

export class TestService1 extends ServiceModule {

    // 测试ServiceModule的service属性
    testServiceProperty = 'abc';

    async onStart(): Promise<void> {
        log.l(this.name);
    }

    async onStop() {
        log.l(this.name);
    }
}

export class TestService2 extends ServiceModule {

    public get name(): string {
        return '测试类2';
    }

    status = 0;

    async onStart(): Promise<void> {
        log.l(this.name);

        setTimeout(() => {
            this.status = 1;
        }, 3000);

        if(this.services.TestService1.testServiceProperty !== 'abc'){
            throw new Error('ServiceModule的service属性存在问题！');
        }
    }

    async onStop() {
        log.l(this.name);
    }

    async onHealthChecking() {
        if (this.status === 1) throw new Error('*1*');
    }
}