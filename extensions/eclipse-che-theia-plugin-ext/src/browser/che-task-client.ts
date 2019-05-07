/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/
import { CheTaskClient } from '../common/che-protocol';
import { Emitter, Event } from '@theia/core';
import { injectable } from 'inversify';
import { TaskConfiguration, TaskInfo } from '@eclipse-che/plugin';

@injectable()
export class CheTaskClientImpl implements CheTaskClient {
    private readonly onKillEventEmitter: Emitter<number>;
    private taskInfoHandlers: ((id: number) => Promise<TaskInfo>)[] = [];
    private runTaskHandlers: ((id: number, config: TaskConfiguration, ctx?: string) => Promise<void>)[] = [];
    private taskExitedHandlers: ((id: number) => Promise<void>)[] = [];

    constructor() {
        this.onKillEventEmitter = new Emitter<number>();
    }

    async runTask(id: number, taskConfig: TaskConfiguration, ctx?: string): Promise<void> {
        for (const runTaskHandler of this.runTaskHandlers) {
            await runTaskHandler(id, taskConfig, ctx);
        }
        return undefined;
    }

    async getTaskInfo(id: number): Promise<TaskInfo | undefined> {
        console.log('///////////////////////////////////////// getTaskInfo ');
        for (const taskInfoHandler of this.taskInfoHandlers) {
            console.log('//////////// getTaskInfo ' + id);
            try {
                const taskInfo = await taskInfoHandler(id);
                console.log('//////////// getTaskInfo //// after run taskInfoHandler' + id);
                if (taskInfo) {
                    console.log('//////////// getTaskInfo //// RETURN task info ' + id);
                    return taskInfo;
                }
            } catch (e) {
                // allow another hanlers to handle request
                console.log(console.log('//////////// getTaskInfo  //// ERROR ' + id));
            }
        }
        console.log('//////////// getTaskInfo //// RETURN UNDEFINED ' + id);
        return undefined;
    }

    async onTaskExited(id: number): Promise<void> {
        console.log('///////////////////////////////////////// onTaskExited ');
        for (const taskExitedHandler of this.taskExitedHandlers) {
            console.log('//////////// onTaskExited ' + id);
            try {
                await taskExitedHandler(id);
                console.log('//////////// onTaskExited //// after run taskExitedHandler' + id);
            } catch (e) {
                // allow another hanlers to handle request
                console.log(console.log('//////////// onTaskExited  //// ERROR ' + id + ' //// ' + e));
            }
        }
    }

    get onKillEvent(): Event<number> {
        return this.onKillEventEmitter.event;
    }

    async killTask(id: number): Promise<void> {
        this.onKillEventEmitter.fire(id);
    }

    setTaskInfoHandler(handler: (id: number) => Promise<TaskInfo>) {
        console.log('//////////// setTaskInfoHandler ');
        this.taskInfoHandlers.push(handler);
    }

    setRunTaskHandler(handler: (id: number, config: TaskConfiguration, ctx?: string) => Promise<void>) {
        console.log('//////////// setRunTaskHandler ');
        this.runTaskHandlers.push(handler);
    }

    setTaskExitedHandler(handler: (id: number) => Promise<void>) {
        console.log('//////////// setTaskExitedHandler ');
        this.taskExitedHandlers.push(handler);
    }
}
