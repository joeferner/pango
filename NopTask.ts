import {Task} from "./Task";
import {TaskOptions} from "./TaskOptions";

export class NopTask extends Task {
    run(taskOptions: TaskOptions): Promise<void> {
        return Promise.resolve();
    }
}