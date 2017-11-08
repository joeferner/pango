import {ProjectOptions} from "./ProjectOptions";
import * as childProcess from "child-process-promise";
import {TaskOptions} from "./TaskOptions";
import {SpawnOptions} from "child_process";

const spawn = childProcess.spawn;

export abstract class Task {
    name?: string;

    abstract run(taskOptions: TaskOptions): Promise<void | Tasks>;

    getPrerequisites(projectOptions: ProjectOptions): string[] {
        return [];
    }

    getPostRequisites(projectOptions: ProjectOptions): string[] {
        return []
    }

    shell(taskOptions: TaskOptions, cmd: string[], options?: SpawnOptions): Promise<void> {
        const promise = spawn(cmd[0], cmd.slice(1));
        const childProcess = promise.childProcess;
        childProcess.stdout.on('data', function (data) {
            let lines = data.toString().trim().split('\n');
            for (const line of lines) {
                taskOptions.log.info(line);
            }
        });
        childProcess.stderr.on('data', function (data) {
            let lines = data.toString().trim().split('\n');
            for (const line of lines) {
                taskOptions.log.error(line);
            }
        });
        return promise;
    }
}

export type Tasks = { [name: string]: Task };
