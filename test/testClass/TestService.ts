import { ServiceModule, log, HealthStatus } from "../../bin/index";

export class TestService1 extends ServiceModule {

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

    status = HealthStatus.success;

    async onStart(): Promise<void> {
        log.l(this.name);
        
        setTimeout(() => {
            this.status = HealthStatus.unhealthy;
        }, 3000);
    }

    async onStop() {
        log.l(this.name);
    }

    async onHealthChecking() {
        return this.status;
    }

    onError():any{

    }
}