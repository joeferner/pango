import {Target} from "./Target";
import {Task, Tasks} from "./Task";
import {ProjectOptions} from "./ProjectOptions";
import {Pango} from "./Pango";
import {TaskOptions} from "./TaskOptions";

export class HelpTask extends Task {
    private pango: Pango;

    constructor(pango: Pango) {
        super();
        this.pango = pango;
    }

    run(taskOptions: TaskOptions): Promise<void> {
        const targets = taskOptions.projectOptions.targets;
        const maxKeyLength = Object.keys(targets).reduce((maxLength, key) => {
            return Math.max(maxLength, key.length);
        }, 0);

        for (const targetKey of Object.keys(targets).sort()) {
            const target: Target = targets[targetKey];
            console.log(
                (targetKey + '                          ').substr(0, maxKeyLength + 1)
                + (target.helpMessage || ''));
        }
        return Promise.resolve();
    }
}

export class HelpTarget extends Target {
    private pango: Pango;

    constructor(pango: Pango) {
        super();
        this.pango = pango;
    }

    get helpMessage(): string {
        return 'print help';
    }

    getTasks(projectOptions: ProjectOptions): Promise<Tasks> {
        return Promise.resolve({help: new HelpTask(this.pango)});
    }
}