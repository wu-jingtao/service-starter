import { ServicesManager } from "../../bin/index";
import { TestService1, TestService2 } from "./TestService";

export default function test(done: any) {
    const sm = new ServicesManager();
    sm.registerService(new TestService1);
    sm.registerService(new TestService2);
    sm.start();
    sm.on('started', done);
}