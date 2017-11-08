import {Target} from "./Target";
import {ProjectOptions} from "./ProjectOptions";
import {Task, Tasks} from "./Task";
import {TaskOptions} from "./TaskOptions";
import * as fs from "fs-extra";

export class CleanTask extends Task {
    run(taskOptions: TaskOptions): Promise<void> {
        return fs.remove(taskOptions.projectOptions.buildDir);
    }
}

export class CleanTarget extends Target {
    getTasks(projectOptions: ProjectOptions): Promise<Tasks> {
        return Promise.resolve({
            clean: new CleanTask()
        });
    }

    get helpMessage(): string {
        return 'deletes build directory';
    }
}