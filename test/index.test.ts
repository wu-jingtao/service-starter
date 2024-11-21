/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/parameter-properties */

import fs from 'fs';
import path from 'path';
import { fork, type ChildProcess } from 'child_process';
import { setTimeout } from 'timers/promises';
import _ from 'lodash';
import expect from 'expect.js';
import { Module } from '../src/base/Module';
import { ModuleManager, type ModuleManagerOptions } from '../src/base/ModuleManager';
import { RunningStatus } from '../src/base/RunningStatus';
import type { HealthCheckResult } from '../src';

describe('测试 Base', function () {
    const testResult: any[] = [];

    class TestModule extends Module {
        onStartThrowError?: boolean;
        onStartEmitError?: boolean;
        onStopThrowError?: boolean;
        onStopEmitError?: boolean;
        onHealthCheckThrowError?: boolean;
        onErrorPreventPropagate?: boolean;

        override get name(): string {
            return this._name;
        }

        constructor(private readonly _name: string) { super() }

        override async onStart(): Promise<void> {
            testResult.push(`${this.name} onStart ${RunningStatus[this.status]} ${RunningStatus[this.manager.status]}`);
            if (this.onStartThrowError) { throw new Error(`${this.name} onStart`) }
            if (this.onStartEmitError) { this.emit('error', new Error(`${this.name} onStart`)) }
        }

        override async onStop(): Promise<void> {
            testResult.push(`${this.name} onStop ${RunningStatus[this.status]} ${RunningStatus[this.manager.status]}`);
            if (this.onStopThrowError) { throw new Error(`${this.name} onStop`) }
            if (this.onStopEmitError) { this.emit('error', new Error(`${this.name} onStart`)) }
        }

        override async onHealthCheck(): Promise<void> {
            testResult.push(`${this.name} onHealthCheck ${RunningStatus[this.status]} ${RunningStatus[this.manager.status]}`);
            if (this.onHealthCheckThrowError) { throw new Error(`${this.name} onHealthCheck`) }
        }

        override async onError(err: Error): Promise<false | undefined> {
            testResult.push(`${this.name} onError ${err.message}`);
            return this.onErrorPreventPropagate ? false : undefined;
        }
    }

    function createTestCase(options?: ModuleManagerOptions): [ModuleManager, TestModule, TestModule, TestModule] {
        const manager = new ModuleManager(options);
        const test1 = new TestModule('test1');
        const test2 = new TestModule('test2');
        const test3 = new TestModule('test3');

        manager.registerModule(test1);
        manager.registerModule(test2);
        manager.registerModule(test3);

        manager.on('started', () => testResult.push('manager started'));
        manager.on('stopped', (exitCode: number) => testResult.push(`manager stopped ${exitCode}`));
        manager.on('error', (err: Error, module: Module) => testResult.push(`manager onError ${module.name} ${err.message}`));
        manager.on('unhealthy', (err: Error, module: Module) => testResult.push(`manager onUnhealthy ${module.name} ${err.message}`));

        return [manager, test1, test2, test3];
    }

    afterEach(function () {
        testResult.length = 0;
    });

    it('测试 注册模块', function () {
        class ModuleManager1 extends ModuleManager { }
        class ModuleManager2 extends ModuleManager { }
        const manager1 = new ModuleManager1();
        const manager2 = new ModuleManager2();
        const test1 = new TestModule('test1');
        const test2 = new TestModule('test2');

        manager1.registerModule(test1);
        manager2.registerModule(test2);

        expect(manager1.registerModule.bind(manager1)).withArgs(test1).throwError((err: Error) => {
            expect(err.message).to.be('模块 test1 已注册过了');
        });

        expect(manager1.registerModule.bind(manager1)).withArgs(test2).throwError((err: Error) => {
            expect(err.message).to.be('模块 test2 已经在 ModuleManager2 上注册过了');
        });
    });

    it('测试 modules 属性', function () {
        const [manager, test1, test2, test3] = createTestCase();

        expect(manager.modules.get('test1')).to.be(test1);
        expect(manager.modules.get('test2')).to.be(test2);
        expect(manager.modules.get('test3')).to.be(test3);
        expect(manager.modules.get('test4')).to.be(undefined);

        expect(test1.manager).to.be(manager);
        expect(test2.manager).to.be(manager);
        expect(test3.manager).to.be(manager);

        expect(test1.modules.test2).to.be(test2);
        expect(test1.modules.test3).to.be(test3);
        expect(test2.modules.test1).to.be(test1);
        expect(test2.modules.test3).to.be(test3);
        expect(test3.modules.test1).to.be(test1);
        expect(test3.modules.test2).to.be(test2);

        expect(test1.modules.test4).to.be(undefined);
        expect(test2.modules.test4).to.be(undefined);
        expect(test3.modules.test4).to.be(undefined);
    });

    it('测试 正常启动、关闭、健康检查', async function () {
        const [manager, test1, test2, test3] = createTestCase();

        var exceptions = await manager.start();
        expect(exceptions).to.be(undefined);
        expect(manager.status).to.be(RunningStatus.running);
        expect(test1.status).to.be(RunningStatus.running);
        expect(test2.status).to.be(RunningStatus.running);
        expect(test3.status).to.be(RunningStatus.running);

        var exception = await manager.healthCheck();
        expect(exception).to.be(undefined);

        var exceptions = await manager.stop();
        expect(exceptions).to.be(undefined);
        expect(manager.status).to.be(RunningStatus.stopped);
        expect(test1.status).to.be(RunningStatus.stopped);
        expect(test2.status).to.be(RunningStatus.stopped);
        expect(test3.status).to.be(RunningStatus.stopped);

        expect(testResult).to.eql([
            ..._.times(3, i => `test${i + 1} onStart starting starting`), 'manager started',
            ..._.times(3, i => `test${i + 1} onHealthCheck running running`),
            ..._.times(3, i => `test${i + 1} onStop stopping stopping`).reverse(), 'manager stopped 0'
        ]);
    });

    describe('测试 启动异常', function () {
        it('测试 启动时模块 onStart 出现异常', async function () {
            const [manager, test1, test2, test3] = createTestCase();
            test2.onStartThrowError = true;

            const exceptions = await manager.start();

            expect(exceptions?.[0]?.module).to.eql(test2);
            expect(exceptions?.[0]?.error.message).to.eql('test2 onStart');
            expect(manager.status).to.be(RunningStatus.stopped);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopped);
            expect(test3.status).to.be(RunningStatus.stopped);

            expect(testResult).to.eql([
                ..._.times(2, i => `test${i + 1} onStart starting starting`),
                ..._.times(2, i => `test${i + 1} onStop stopping starting`).reverse()
            ]);
        });

        it('测试 启动时模块 onStart 通过 emit("error") 抛出异常', async function () {
            const [manager, test1, test2, test3] = createTestCase();
            test2.onStartEmitError = true;

            const exceptions = await manager.start();

            expect(exceptions?.[0]?.module).to.eql(test2);
            expect(exceptions?.[0]?.error.message).to.eql('禁止模块的状态为 starting 时通过 emit("error") 抛出异常');
            expect(manager.status).to.be(RunningStatus.stopped);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopped);
            expect(test3.status).to.be(RunningStatus.stopped);

            expect(testResult).to.eql([
                ..._.times(2, i => `test${i + 1} onStart starting starting`),
                ..._.times(2, i => `test${i + 1} onStop stopping starting`).reverse()
            ]);
        });

        it('测试 启动时模块 status 不为 stopped', async function () {
            const [manager, test1, test2, test3] = createTestCase();

            // @ts-expect-error
            test2.status = RunningStatus.running;
            var exceptions = await manager.start();

            expect(exceptions?.[0]?.module).to.eql(test2);
            expect(exceptions?.[0]?.error.message).to.eql('模块 test2 处于 running 的状况下又再次被 启动');
            expect(manager.status).to.be(RunningStatus.stopped);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopped);
            expect(test3.status).to.be(RunningStatus.stopped);

            // @ts-expect-error
            test2.status = RunningStatus.starting;
            var exceptions = await manager.start();

            expect(exceptions?.[0]?.module).to.eql(test2);
            expect(exceptions?.[0]?.error.message).to.eql('模块 test2 处于 starting 的状况下又再次被 启动');
            expect(manager.status).to.be(RunningStatus.stopped);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopped);
            expect(test3.status).to.be(RunningStatus.stopped);

            // @ts-expect-error
            test2.status = RunningStatus.stopping;
            var exceptions = await manager.start();

            expect(exceptions?.[0]?.module).to.eql(test2);
            expect(exceptions?.[0]?.error.message).to.eql('模块 test2 处于 stopping 的状况下又再次被 启动');
            expect(manager.status).to.be(RunningStatus.stopped);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopping);
            expect(test3.status).to.be(RunningStatus.stopped);

            expect(testResult).to.eql([
                ..._.times(1, i => `test${i + 1} onStart starting starting`),
                ..._.times(2, i => `test${i + 1} onStop stopping starting`).reverse(),
                ..._.times(1, i => `test${i + 1} onStart starting starting`),
                ..._.times(2, i => `test${i + 1} onStop stopping starting`).reverse(),
                ..._.times(1, i => `test${i + 1} onStart starting starting`),
                ..._.times(1, i => `test${i + 1} onStop stopping starting`).reverse(),
            ]);
        });

        it('测试 启动时模块管理器 status 不为 stopped', async function () {
            const [manager, test1, test2, test3] = createTestCase();

            // @ts-expect-error
            manager.status = RunningStatus.running;
            var exceptions = await manager.start();

            expect(exceptions?.[0]?.module).to.eql(undefined);
            expect(exceptions?.[0]?.error.message).to.eql('模块管理器 ModuleManager 处于 running 的状况下又再次被 启动');
            expect(manager.status).to.be(RunningStatus.running);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopped);
            expect(test3.status).to.be(RunningStatus.stopped);

            // @ts-expect-error
            manager.status = RunningStatus.starting;
            var exceptions = await manager.start();

            expect(exceptions?.[0]?.module).to.eql(undefined);
            expect(exceptions?.[0]?.error.message).to.eql('模块管理器 ModuleManager 处于 starting 的状况下又再次被 启动');
            expect(manager.status).to.be(RunningStatus.starting);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopped);
            expect(test3.status).to.be(RunningStatus.stopped);

            // @ts-expect-error
            manager.status = RunningStatus.stopping;
            var exceptions = await manager.start();

            expect(exceptions?.[0]?.module).to.eql(undefined);
            expect(exceptions?.[0]?.error.message).to.eql('模块管理器 ModuleManager 处于 stopping 的状况下又再次被 启动');
            expect(manager.status).to.be(RunningStatus.stopping);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopped);
            expect(test3.status).to.be(RunningStatus.stopped);

            expect(testResult).to.eql([]);
        });
    });

    describe('测试 关闭异常', function () {
        it('测试 关闭时模块 onStop 出现异常', async function () {
            const [manager, test1, test2, test3] = createTestCase();
            test2.onStopThrowError = true;

            await manager.start();
            const exceptions = await manager.stop();

            expect(exceptions?.[0]?.module).to.eql(test2);
            expect(exceptions?.[0]?.error.message).to.eql('test2 onStop');
            expect(manager.status).to.be(RunningStatus.stopped);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopping);
            expect(test3.status).to.be(RunningStatus.stopped);

            expect(testResult).to.eql([
                ..._.times(3, i => `test${i + 1} onStart starting starting`), 'manager started',
                ..._.times(3, i => `test${i + 1} onStop stopping stopping`).reverse(), 'manager stopped 2'
            ]);
        });

        it('测试 关闭时模块 onStop 通过 emit("error") 抛出异常', async function () {
            const [manager, test1, test2, test3] = createTestCase();
            test2.onStopEmitError = true;

            await manager.start();
            const exceptions = await manager.stop();

            expect(exceptions?.[0]?.module).to.eql(test2);
            expect(exceptions?.[0]?.error.message).to.eql('禁止模块的状态为 stopping 时通过 emit("error") 抛出异常');
            expect(manager.status).to.be(RunningStatus.stopped);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopping);
            expect(test3.status).to.be(RunningStatus.stopped);

            expect(testResult).to.eql([
                ..._.times(3, i => `test${i + 1} onStart starting starting`), 'manager started',
                ..._.times(3, i => `test${i + 1} onStop stopping stopping`).reverse(), 'manager stopped 2'
            ]);
        });

        it('测试 关闭时模块 status 不为 running', async function () {
            const [manager, test1, test2, test3] = createTestCase();

            await manager.start();
            // @ts-expect-error
            test2.status = RunningStatus.stopped;
            var exceptions = await manager.stop();

            expect(exceptions?.[0]?.module).to.eql(test2);
            expect(exceptions?.[0]?.error.message).to.eql('模块 test2 处于 stopped 的状况下又再次被 关闭');
            expect(manager.status).to.be(RunningStatus.stopped);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopped);
            expect(test3.status).to.be(RunningStatus.stopped);

            await manager.start();
            // @ts-expect-error
            test2.status = RunningStatus.starting;
            var exceptions = await manager.stop();

            expect(exceptions).to.eql(undefined);
            expect(manager.status).to.be(RunningStatus.stopped);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopped);
            expect(test3.status).to.be(RunningStatus.stopped);

            await manager.start();
            // @ts-expect-error
            test2.status = RunningStatus.stopping;
            var exceptions = await manager.stop();

            expect(exceptions?.[0]?.module).to.eql(test2);
            expect(exceptions?.[0]?.error.message).to.eql('模块 test2 处于 stopping 的状况下又再次被 关闭');
            expect(manager.status).to.be(RunningStatus.stopped);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopping);
            expect(test3.status).to.be(RunningStatus.stopped);

            expect(testResult).to.eql([
                ..._.times(3, i => `test${i + 1} onStart starting starting`), 'manager started',
                ..._.times(2, i => `test${i === 0 ? 1 : 3} onStop stopping stopping`).reverse(), 'manager stopped 2',
                ..._.times(3, i => `test${i + 1} onStart starting starting`), 'manager started',
                ..._.times(3, i => `test${i + 1} onStop stopping stopping`).reverse(), 'manager stopped 0',
                ..._.times(3, i => `test${i + 1} onStart starting starting`), 'manager started',
                ..._.times(2, i => `test${i === 0 ? 1 : 3} onStop stopping stopping`).reverse(), 'manager stopped 2',
            ]);
        });

        it('测试 关闭时模块管理器 status 不为 running', async function () {
            const [manager, test1, test2, test3] = createTestCase();

            await manager.start();
            // @ts-expect-error
            manager.status = RunningStatus.stopped;
            var exceptions = await manager.stop();

            expect(exceptions?.[0]?.module).to.eql(undefined);
            expect(exceptions?.[0]?.error.message).to.eql('模块管理器 ModuleManager 处于 stopped 的状况下又再次被 关闭');
            expect(manager.status).to.be(RunningStatus.stopped);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopped);
            expect(test3.status).to.be(RunningStatus.stopped);

            await manager.start();
            // @ts-expect-error
            manager.status = RunningStatus.starting;
            var exceptions = await manager.stop();

            expect(exceptions?.[0]?.module).to.eql(undefined);
            expect(exceptions?.[0]?.error.message).to.eql('模块管理器 ModuleManager 处于 starting 的状况下又再次被 关闭');
            expect(manager.status).to.be(RunningStatus.stopped);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopped);
            expect(test3.status).to.be(RunningStatus.stopped);

            await manager.start();
            // @ts-expect-error
            manager.status = RunningStatus.stopping;
            var exceptions = await manager.stop();

            expect(exceptions?.[0]?.module).to.eql(undefined);
            expect(exceptions?.[0]?.error.message).to.eql('模块管理器 ModuleManager 处于 stopping 的状况下又再次被 关闭');
            expect(manager.status).to.be(RunningStatus.stopped);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopped);
            expect(test3.status).to.be(RunningStatus.stopped);

            expect(testResult).to.eql([
                ..._.times(3, i => `test${i + 1} onStart starting starting`), 'manager started',
                ..._.times(3, i => `test${i + 1} onStop stopping stopping`).reverse(), 'manager stopped 2',
                ..._.times(3, i => `test${i + 1} onStart starting starting`), 'manager started',
                ..._.times(3, i => `test${i + 1} onStop stopping stopping`).reverse(), 'manager stopped 2',
                ..._.times(3, i => `test${i + 1} onStart starting starting`), 'manager started',
                ..._.times(3, i => `test${i + 1} onStop stopping stopping`).reverse(), 'manager stopped 2',
            ]);
        });
    });

    describe('测试 运行异常', function () {
        it('测试 运行时模块出现异常', async function () {
            const [manager, test1, test2, test3] = createTestCase();
            test3.onErrorPreventPropagate = true;

            await manager.start();

            test2.emit('error', new Error('test2_message'));
            await setTimeout(20);

            expect(manager.status).to.be(RunningStatus.running);
            expect(test1.status).to.be(RunningStatus.running);
            expect(test2.status).to.be(RunningStatus.running);
            expect(test3.status).to.be(RunningStatus.running);

            test3.emit('error', new Error('test3_message'));
            await setTimeout(20);

            expect(manager.status).to.be(RunningStatus.running);
            expect(test1.status).to.be(RunningStatus.running);
            expect(test2.status).to.be(RunningStatus.running);
            expect(test3.status).to.be(RunningStatus.running);

            expect(testResult).to.eql([
                ..._.times(3, i => `test${i + 1} onStart starting starting`), 'manager started',
                'test2 onError test2_message', 'manager onError test2 test2_message',
                'test3 onError test3_message',
            ]);
        });

        it('测试 运行时模块出现异常导致模块管理器关闭', async function () {
            const [manager, test1, test2, test3] = createTestCase({ stopOnError: true });
            test2.onErrorPreventPropagate = true;

            await manager.start();

            test2.emit('error', new Error('test2_message'));
            await setTimeout(20);

            expect(manager.status).to.be(RunningStatus.running);
            expect(test1.status).to.be(RunningStatus.running);
            expect(test2.status).to.be(RunningStatus.running);
            expect(test3.status).to.be(RunningStatus.running);

            test3.emit('error', new Error('test3_message'));
            await setTimeout(20);

            expect(manager.status).to.be(RunningStatus.stopped);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopped);
            expect(test3.status).to.be(RunningStatus.stopped);

            expect(testResult).to.eql([
                ..._.times(3, i => `test${i + 1} onStart starting starting`), 'manager started',
                'test2 onError test2_message',
                'test3 onError test3_message', 'manager onError test3 test3_message',
                ..._.times(3, i => `test${i + 1} onStop stopping stopping`).reverse(), 'manager stopped 2'
            ]);
        });
    });

    describe('测试 健康检查异常', function () {
        it('测试 模块管理器的运行状态不为 Running 健康检查直接判定为异常', async function () {
            const [manager] = createTestCase();

            var exception = await manager.healthCheck();
            expect(exception?.module).to.be(undefined);
            expect(exception?.error.message).to.be('ModuleManager 尚未完全启动');

            // @ts-expect-error
            manager.status = RunningStatus.starting;
            var exception = await manager.healthCheck();
            expect(exception?.module).to.be(undefined);
            expect(exception?.error.message).to.be('ModuleManager 尚未完全启动');

            // @ts-expect-error
            manager.status = RunningStatus.stopping;
            var exception = await manager.healthCheck();
            expect(exception?.module).to.be(undefined);
            expect(exception?.error.message).to.be('ModuleManager 尚未完全启动');

            // @ts-expect-error
            manager.status = RunningStatus.running;
            var exception = await manager.healthCheck();
            expect(exception).to.be(undefined);
        });

        it('测试 健康检查时模块出现异常', async function () {
            const [manager, test1, test2, test3] = createTestCase();
            test2.onHealthCheckThrowError = true;

            await manager.start();
            var exception = await manager.healthCheck();

            expect(exception?.module).to.be(test2);
            expect(exception?.error.message).to.be('test2 onHealthCheck');
            expect(manager.status).to.be(RunningStatus.running);
            expect(test1.status).to.be(RunningStatus.running);
            expect(test2.status).to.be(RunningStatus.running);
            expect(test3.status).to.be(RunningStatus.running);

            expect(testResult).to.eql([
                ..._.times(3, i => `test${i + 1} onStart starting starting`), 'manager started',
                ..._.times(2, i => `test${i + 1} onHealthCheck running running`),
                'manager onUnhealthy test2 test2 onHealthCheck',
            ]);
        });

        it('测试 健康检查时模块出现异常导致模块管理器关闭', async function () {
            const [manager, test1, test2, test3] = createTestCase({ stopOnUnhealthy: true });
            test2.onHealthCheckThrowError = true;

            await manager.start();
            var exception = await manager.healthCheck();
            await setTimeout(20);

            expect(exception?.module).to.be(test2);
            expect(exception?.error.message).to.be('test2 onHealthCheck');
            expect(manager.status).to.be(RunningStatus.stopped);
            expect(test1.status).to.be(RunningStatus.stopped);
            expect(test2.status).to.be(RunningStatus.stopped);
            expect(test3.status).to.be(RunningStatus.stopped);

            expect(testResult).to.eql([
                ..._.times(3, i => `test${i + 1} onStart starting starting`), 'manager started',
                ..._.times(2, i => `test${i + 1} onHealthCheck running running`),
                'manager onUnhealthy test2 test2 onHealthCheck',
                ..._.times(3, i => `test${i + 1} onStop stopping stopping`).reverse(), 'manager stopped 2'
            ]);
        });
    });
});

describe('测试 Node', function () {
    this.timeout(1000 * 20);

    function createProcess(code: string): ChildProcess {
        const imports = `
            import _ from 'lodash';
            import expect from 'expect.js';
            import { Module } from '../src/base/Module';
            import { RunningStatus } from '../src/base/RunningStatus';
            import { NodeModuleManager, type NodeModuleManagerOptions } from '../src/node/NodeModuleManager';
        `;

        const testEnvironment = `
            const testResult: any[] = [];

            class TestModule extends Module {
                onHealthCheckThrowError?: boolean;

                override get name(): string {
                    return this._name;
                }

                constructor(private readonly _name: string) { super() }

                override async onStart(): Promise<void> {
                    testResult.push(\`\${this.name} onStart \${RunningStatus[this.status]} \${RunningStatus[this.manager.status]}\`);
                }

                override async onStop(): Promise<void> {
                    testResult.push(\`\${this.name} onStop \${RunningStatus[this.status]} \${RunningStatus[this.manager.status]}\`);
                }

                override async onHealthCheck(): Promise<void> {
                    testResult.push(\`\${this.name} onHealthCheck \${RunningStatus[this.status]} \${RunningStatus[this.manager.status]}\`);
                    if (this.onHealthCheckThrowError) { throw new Error(\`\${this.name} onHealthCheck\`) }
                }
            }

            function createTestCase(options?: NodeModuleManagerOptions): [NodeModuleManager, TestModule, TestModule, TestModule] {
                const manager = new NodeModuleManager(options);
                const test1 = new TestModule('test1');
                const test2 = new TestModule('test2');
                const test3 = new TestModule('test3');

                manager.registerModule(test1);
                manager.registerModule(test2);
                manager.registerModule(test3);

                manager.on('started', () => testResult.push('manager started'));
                manager.on('stopped', (exitCode: number) => testResult.push(\`manager stopped \${exitCode}\`));

                return [manager, test1, test2, test3];
            }

            // 由于使用 child.kill('SIGINT') 会导致进程直接关闭，这里手动模拟信号发出
            if (process.connected) {
                process.on('message', (message: any) => {
                    if (message.type === 'signal') {
                        process.emit(message.signal);
                    }
                });
            }

            function ok(message?: unknown) {
                process.send?.({ type: 'testing', ok: true, message });
            }

            function failed(error: unknown) {
                process.send?.({ type: 'testing', error: (error as Error).message });
            }

            setTimeout(() => {
                failed(new Error('timeout'));
            }, 1000 * 10);
        `;

        code = `
            ${imports}
            ${testEnvironment}

            (async () => {
                try {
                    {${code}}
                    ok();
                } catch (error) {
                    failed(error);
                }
            })();
        `;

        const tempFile = path.resolve(__dirname, '../.temp/service-starter.test.ts');
        const tempDir = path.dirname(tempFile);
        if (!fs.existsSync(tempDir)) { fs.mkdirSync(tempDir) }
        fs.writeFileSync(tempFile, code);

        return fork(tempFile, {
            execArgv: ['--require', 'ts-node/register'],
            stdio: [0, 1, 2, 'ipc'],
            timeout: 1000 * 15
        });
    }

    it('测试 重复创建 NodeModuleManager', async function () {
        return new Promise((resolve, reject) => {
            const child = createProcess(`
                new NodeModuleManager();
                expect(() => new NodeModuleManager()).throwError((err: Error) => {
                    expect(err.message).to.be('一个进程只允许创建一个 NodeModuleManager');
                });
            `);

            child.on('message', (message: any) => {
                if (message.type === 'testing') {
                    message.ok ? resolve() : reject(new Error(message.error));
                    child.kill();
                }
            });
        });
    });

    it('测试 exitAfterStopped', async function () {
        return new Promise((resolve, reject) => {
            const child = createProcess(`
                const [manager, test1, test2, test3] = createTestCase();

                var exceptions = await manager.start();
                expect(exceptions).to.be(undefined);
                expect(manager.status).to.be(RunningStatus.running);
                expect(test1.status).to.be(RunningStatus.running);
                expect(test2.status).to.be(RunningStatus.running);
                expect(test3.status).to.be(RunningStatus.running);

                var exception = await manager.healthCheck();
                expect(exception).to.be(undefined);

                var exceptions = await manager.stop();
                expect(exceptions).to.be(undefined);
                expect(manager.status).to.be(RunningStatus.stopped);
                expect(test1.status).to.be(RunningStatus.stopped);
                expect(test2.status).to.be(RunningStatus.stopped);
                expect(test3.status).to.be(RunningStatus.stopped);

                expect(testResult).to.eql([
                    ..._.times(3, i => \`test\${i + 1} onStart starting starting\`), 'manager started',
                    ..._.times(3, i => \`test\${i + 1} onHealthCheck running running\`),
                    ..._.times(3, i => \`test\${i + 1} onStop stopping stopping\`).reverse(), 'manager stopped 0'
                ]);
            `);

            child.on('message', (message: any) => {
                if (message.type === 'testing') {
                    if (message.ok) {
                        child.on('exit', exitCode => {
                            exitCode ? reject(new Error(`exit code ${exitCode}`)) : resolve();
                        });
                    } else {
                        reject(new Error(message.error));
                    }
                }
            });
        });
    });

    it('测试 stopOnSIGTERM', async function () {
        return new Promise((resolve, reject) => {
            const child = createProcess(`
                const [manager, test1, test2, test3] = createTestCase();

                var exceptions = await manager.start();
                expect(exceptions).to.be(undefined);
                expect(manager.status).to.be(RunningStatus.running);
                expect(test1.status).to.be(RunningStatus.running);
                expect(test2.status).to.be(RunningStatus.running);
                expect(test3.status).to.be(RunningStatus.running);

                manager.on('stopped', () => {
                    try {
                        expect(manager.status).to.be(RunningStatus.stopped);
                        expect(test1.status).to.be(RunningStatus.stopped);
                        expect(test2.status).to.be(RunningStatus.stopped);
                        expect(test3.status).to.be(RunningStatus.stopped);

                        expect(testResult).to.eql([
                            ..._.times(3, i => \`test\${i + 1} onStart starting starting\`), 'manager started',
                            ..._.times(3, i => \`test\${i + 1} onStop stopping stopping\`).reverse(), 'manager stopped 0'
                        ]);
                    } catch (error) {
                        failed(error);
                    }
                });
            `);

            child.on('message', (message: any) => {
                if (message.type === 'testing') {
                    if (message.ok) {
                        child.on('exit', exitCode => {
                            exitCode ? reject(new Error(`exit code ${exitCode}`)) : resolve();
                        });

                        child.send({ type: 'signal', signal: 'SIGTERM' });
                    } else {
                        reject(new Error(message.error));
                    }
                }
            });
        });
    });

    it('测试 stopOnSIGINT', async function () {
        return new Promise((resolve, reject) => {
            const child = createProcess(`
                const [manager, test1, test2, test3] = createTestCase();

                var exceptions = await manager.start();
                expect(exceptions).to.be(undefined);
                expect(manager.status).to.be(RunningStatus.running);
                expect(test1.status).to.be(RunningStatus.running);
                expect(test2.status).to.be(RunningStatus.running);
                expect(test3.status).to.be(RunningStatus.running);

                manager.on('stopped', () => {
                    try {
                        expect(manager.status).to.be(RunningStatus.stopped);
                        expect(test1.status).to.be(RunningStatus.stopped);
                        expect(test2.status).to.be(RunningStatus.stopped);
                        expect(test3.status).to.be(RunningStatus.stopped);

                        expect(testResult).to.eql([
                            ..._.times(3, i => \`test\${i + 1} onStart starting starting\`), 'manager started',
                            ..._.times(3, i => \`test\${i + 1} onStop stopping stopping\`).reverse(), 'manager stopped 0'
                        ]);
                    } catch (error) {
                        failed(error);
                    }
                });
            `);

            child.on('message', (message: any) => {
                if (message.type === 'testing') {
                    if (message.ok) {
                        child.on('exit', exitCode => {
                            exitCode ? reject(new Error(`exit code ${exitCode}`)) : resolve();
                        });

                        child.send({ type: 'signal', signal: 'SIGINT' });
                    } else {
                        reject(new Error(message.error));
                    }
                }
            });
        });
    });

    it('测试 stopOnUnhandledError', async function () {
        return new Promise((resolve, reject) => {
            const child = createProcess(`
                const [manager, test1, test2, test3] = createTestCase({stopOnUnhandledError: true});

                var exceptions = await manager.start();
                expect(exceptions).to.be(undefined);
                expect(manager.status).to.be(RunningStatus.running);
                expect(test1.status).to.be(RunningStatus.running);
                expect(test2.status).to.be(RunningStatus.running);
                expect(test3.status).to.be(RunningStatus.running);

                manager.on('stopped', () => {
                    try {
                        expect(manager.status).to.be(RunningStatus.stopped);
                        expect(test1.status).to.be(RunningStatus.stopped);
                        expect(test2.status).to.be(RunningStatus.stopped);
                        expect(test3.status).to.be(RunningStatus.stopped);

                        expect(testResult).to.eql([
                            ..._.times(3, i => \`test\${i + 1} onStart starting starting\`), 'manager started',
                            ..._.times(3, i => \`test\${i + 1} onStop stopping stopping\`).reverse(), 'manager stopped 2'
                        ]);
                    } catch (error) {
                        failed(error);
                    }
                });

                // 模拟未捕获异常抛出
                setTimeout(() => { throw new Error('unhandled_error') }, 10);
            `);

            child.on('message', (message: any) => {
                if (message.type === 'testing') {
                    if (message.ok) {
                        child.on('exit', exitCode => {
                            exitCode !== 2 ? reject(new Error(`exit code ${exitCode}`)) : resolve();
                        });
                    } else {
                        reject(new Error(message.error));
                    }
                }
            });
        });
    });

    it('测试 调用健康检查', async function () {
        return new Promise((resolve, reject) => {
            const child = createProcess(`
                const [manager, test1, test2, test3] = createTestCase({stopOnUnhandledError: true});

                var exceptions = await manager.start();
                expect(exceptions).to.be(undefined);
                expect(manager.status).to.be(RunningStatus.running);
                expect(test1.status).to.be(RunningStatus.running);
                expect(test2.status).to.be(RunningStatus.running);
                expect(test3.status).to.be(RunningStatus.running);

                ok(1);

                // 等待健康检查完成
                await new Promise((resolve, reject) => {
                    const timer = setInterval(() => {
                        if(testResult.length > 4) {
                            resolve(undefined);
                            clearInterval(timer);
                        }
                    }, 10);
                });

                ok(2);
                test2.onHealthCheckThrowError = true;

                await new Promise((resolve, reject) => {
                    const timer = setInterval(() => {
                        if(testResult.length > 7) {
                            resolve(undefined);
                            clearInterval(timer);
                        }
                    }, 10);
                });

                expect(testResult).to.eql([
                    ..._.times(3, i => \`test\${i + 1} onStart starting starting\`), 'manager started',
                    ..._.times(3, i => \`test\${i + 1} onHealthCheck running running\`),
                    ..._.times(2, i => \`test\${i + 1} onHealthCheck running running\`),
                ]);
            `);

            child.on('message', (message: any) => {
                if (message.type === 'testing') {
                    if (message.ok) {
                        switch (message.message) {
                            case 1: {
                                child.once('message', (message: HealthCheckResult) => {
                                    try {
                                        expect(message.healthy).to.be(true);
                                        expect(message.managerStatue).to.be('running');
                                        expect(message.moduleName).to.be(undefined);
                                        expect(message.description).to.be(undefined);
                                        expect(message.type).to.be('health_check');
                                    } catch (error) {
                                        reject(error as Error);
                                    }
                                });

                                child.send('__health_check__');
                                break;
                            }
                            case 2: {
                                child.once('message', (message: HealthCheckResult) => {
                                    try {
                                        expect(message.healthy).to.be(false);
                                        expect(message.managerStatue).to.be('running');
                                        expect(message.moduleName).to.be('test2');
                                        expect(message.description).to.be('test2 onHealthCheck');
                                        expect(message.type).to.be('health_check');
                                    } catch (error) {
                                        reject(error as Error);
                                    }
                                });

                                child.send('__health_check__');
                                break;
                            }
                            default: {
                                resolve();
                                child.kill();
                                break;
                            }
                        }
                    } else {
                        reject(new Error(message.error));
                    }
                }
            });
        });
    });
});

describe('测试 docker', function () {
    this.timeout(1000 * 20);

    function createProcess(code: string): ChildProcess {
        const imports = `
            import _ from 'lodash';
            import expect from 'expect.js';
            import { Module } from '../src/base/Module';
            import { RunningStatus } from '../src/base/RunningStatus';
            import { DockerModuleManager, type DockerModuleManagerOptions } from '../src/docker/DockerModuleManager';
        `;

        const testEnvironment = `
            const testResult: any[] = [];

            class TestModule extends Module {
                onHealthCheckThrowError?: boolean;

                override get name(): string {
                    return this._name;
                }

                constructor(private readonly _name: string) { super() }

                override async onStart(): Promise<void> {
                    testResult.push(\`\${this.name} onStart \${RunningStatus[this.status]} \${RunningStatus[this.manager.status]}\`);
                }

                override async onStop(): Promise<void> {
                    testResult.push(\`\${this.name} onStop \${RunningStatus[this.status]} \${RunningStatus[this.manager.status]}\`);
                }

                override async onHealthCheck(): Promise<void> {
                    testResult.push(\`\${this.name} onHealthCheck \${RunningStatus[this.status]} \${RunningStatus[this.manager.status]}\`);
                    if (this.onHealthCheckThrowError) { throw new Error(\`\${this.name} onHealthCheck\`) }
                }
            }

            function createTestCase(options?: DockerModuleManagerOptions): [DockerModuleManager, TestModule, TestModule, TestModule] {
                const manager = new DockerModuleManager(options);
                const test1 = new TestModule('test1');
                const test2 = new TestModule('test2');
                const test3 = new TestModule('test3');

                manager.registerModule(test1);
                manager.registerModule(test2);
                manager.registerModule(test3);

                manager.on('started', () => testResult.push('manager started'));
                manager.on('stopped', (exitCode: number) => testResult.push(\`manager stopped \${exitCode}\`));

                return [manager, test1, test2, test3];
            }

            function ok(message?: unknown) {
                process.send?.({ type: 'testing', ok: true, message });
            }

            function failed(error: unknown) {
                process.send?.({ type: 'testing', error: (error as Error).message });
            }

            setTimeout(() => {
                failed(new Error('timeout'));
            }, 1000 * 10);
        `;

        code = `
            ${imports}
            ${testEnvironment}

            (async () => {
                try {
                    {${code}}
                    ok();
                } catch (error) {
                    failed(error);
                }
            })();
        `;

        const tempFile = path.resolve(__dirname, '../.temp/service-starter.test.ts');
        const tempDir = path.dirname(tempFile);
        if (!fs.existsSync(tempDir)) { fs.mkdirSync(tempDir) }
        fs.writeFileSync(tempFile, code);

        return fork(tempFile, {
            execArgv: ['--require', 'ts-node/register'],
            stdio: [0, 1, 2, 'ipc'],
            timeout: 1000 * 15
        });
    }

    it('测试 健康检查', async function () {
        return new Promise((resolve, reject) => {
            const child = createProcess(`
                const [manager, test1, test2, test3] = createTestCase();

                var exceptions = await manager.start();
                expect(exceptions).to.be(undefined);
                expect(manager.status).to.be(RunningStatus.running);
                expect(test1.status).to.be(RunningStatus.running);
                expect(test2.status).to.be(RunningStatus.running);
                expect(test3.status).to.be(RunningStatus.running);

                ok(1);

                // 等待健康检查完成
                await new Promise((resolve, reject) => {
                    const timer = setInterval(() => {
                        if(testResult.length > 4) {
                            resolve(undefined);
                            clearInterval(timer);
                        }
                    }, 10);
                });

                ok(2);
                test2.onHealthCheckThrowError = true;

                await new Promise((resolve, reject) => {
                    const timer = setInterval(() => {
                        if(testResult.length > 7) {
                            resolve(undefined);
                            clearInterval(timer);
                        }
                    }, 10);
                });

                expect(testResult).to.eql([
                    ..._.times(3, i => \`test\${i + 1} onStart starting starting\`), 'manager started',
                    ..._.times(3, i => \`test\${i + 1} onHealthCheck running running\`),
                    ..._.times(2, i => \`test\${i + 1} onHealthCheck running running\`),
                ]);
            `);

            child.on('message', async (message: any) => {
                if (message.type === 'testing') {
                    if (message.ok) {
                        switch (message.message) {
                            case 1: {
                                try {
                                    const res = await fetch('http://localhost:8000');
                                    const message: HealthCheckResult = JSON.parse(await res.text());

                                    expect(res.status).to.be(200);
                                    expect(message.healthy).to.be(true);
                                    expect(message.managerStatue).to.be('running');
                                    expect(message.moduleName).to.be(undefined);
                                    expect(message.description).to.be(undefined);
                                    expect(message.type).to.be('health_check');
                                } catch (error) {
                                    reject(error as Error);
                                }
                                break;
                            }
                            case 2: {
                                try {
                                    const res = await fetch('http://localhost:8000');
                                    const message: HealthCheckResult = JSON.parse(await res.text());

                                    expect(res.status).to.be(500);
                                    expect(message.healthy).to.be(false);
                                    expect(message.managerStatue).to.be('running');
                                    expect(message.moduleName).to.be('test2');
                                    expect(message.description).to.be('test2 onHealthCheck');
                                    expect(message.type).to.be('health_check');
                                } catch (error) {
                                    reject(error as Error);
                                }
                                break;
                            }
                            default: {
                                resolve();
                                child.kill();
                                break;
                            }
                        }
                    } else {
                        reject(new Error(message.error));
                    }
                }
            });
        });
    });
});
