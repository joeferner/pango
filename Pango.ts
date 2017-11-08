import * as fs from "fs-extra";
import {PangoParsedArgs, ProjectOptions} from "./ProjectOptions";
import {Target} from "./Target";
import * as NestedError from "nested-error-stacks";
import {Task, Tasks} from "./Task";
import {TaskOptions} from "./TaskOptions";
import {CleanTarget} from "./CleanTarget";
import {HelpTarget} from "./HelpTarget";
import * as yargs from "yargs";
import {auto, AutoTasks} from "./auto";

export class Pango {
    init(projectOptions: ProjectOptions): Promise<void> {
        projectOptions.target = projectOptions.target || 'build';
        projectOptions.buildDir = projectOptions.buildDir || 'build';
        projectOptions.sourceFiles = projectOptions.sourceFiles || [];
        projectOptions.sourceDirs = projectOptions.sourceDirs || [];
        projectOptions.includeDirs = projectOptions.includeDirs || [];
        projectOptions.targets = projectOptions.targets || {};
        projectOptions.targets['clean'] = projectOptions.targets['clean'] || new CleanTarget();
        projectOptions.targets['help'] = projectOptions.targets['help'] || new HelpTarget(this);
        return fs.mkdirs(projectOptions.buildDir);
    }

    run(projectOptions: ProjectOptions) {
        const args: string[] = projectOptions.args || process.argv.slice(2);
        let nonDashArg = args.findIndex(arg => !arg.startsWith('-'));
        if (nonDashArg === -1) {
            nonDashArg = args.length;
        }
        projectOptions.pangoArgs = args.slice(0, nonDashArg);
        projectOptions.target = args[nonDashArg] || projectOptions.target;
        projectOptions.targetArgs = args.slice(nonDashArg + 1);

        projectOptions.pangoParsedArgs = <PangoParsedArgs><any>yargs
            .option('v', {
                alias: 'verbose',
                describe: 'verbose output',
                type: 'boolean'
            })
            .option('j', {
                alias: 'concurrency',
                describe: 'number of multiple items to run at once',
                type: 'number'
            })
            .parse(projectOptions.pangoArgs);

        return this.runTarget(projectOptions);
    }

    protected runTarget(projectOptions: ProjectOptions): Promise<void> {
        const targets = projectOptions.targets;
        const allTarget = targets['_all'];
        const target = targets[projectOptions.target];
        if (!target) {
            return Promise.reject(new Error(`Unknown target "${projectOptions.target}", available targets [${Object.keys(projectOptions.targets)}]`));
        }
        return Promise.all([
            this.getTasksFromTarget(target, projectOptions),
            allTarget ? this.getTasksFromTarget(allTarget, projectOptions) : Promise.resolve({})
        ])
            .then(results => {
                const tasks = {
                    ...results[1],
                    ...results[0]
                };
                return this.runTasks(projectOptions, tasks);
            })
    }

    protected getTasksFromTarget(target: Target, projectOptions: ProjectOptions): Promise<Tasks> {
        if (!target.getTasks) {
            return Promise.reject(new Error(`Target "${projectOptions.target}" missing "getTask" function`));
        }
        return target.getTasks(projectOptions);
    }

    protected runTasks(projectOptions: ProjectOptions, tasks: Tasks): Promise<void> {
        const autoTasks: AutoTasks = {};
        this.addTasksToAutoTasks(projectOptions, autoTasks, tasks);
        return auto(autoTasks, {
            verbose: projectOptions.pangoParsedArgs.verbose,
            log: console.log,
            projectOptions
        });
    }

    private addTasksToAutoTasks(projectOptions: ProjectOptions, autoTasks: AutoTasks, tasks: Tasks): void {
        const verbose = projectOptions.pangoParsedArgs.verbose;
        for (const taskKey of Object.keys(tasks)) {
            const task = tasks[taskKey];
            this.validateTask(taskKey, task);
            const taskRun = function (task: Task) {
                const taskName = task.name ? task.name : taskKey;
                const taskOptions: TaskOptions = {
                    projectOptions,
                    log: {
                        debug: log.bind(null, taskName, 'DEBUG'),
                        info: log.bind(null, taskName, 'INFO'),
                        warn: log.bind(null, taskName, 'WARN'),
                        error: log.bind(null, taskName, 'ERROR')
                    }
                };
                try {
                    const startTime = new Date().getTime();
                    if (verbose) {
                        taskOptions.log.debug('begin');
                    }
                    return this.runTask(task, taskOptions)
                        .then((newTasks) => {
                            const endTime = new Date().getTime();
                            if (verbose) {
                                taskOptions.log.debug(`end (time: ${endTime - startTime}ms)`);
                            }
                            if (newTasks) {
                                this.addTasksToAutoTasks(projectOptions, autoTasks, newTasks);
                            }
                        })
                        .catch(err => {
                            throw new NestedError(`Task "${taskKey}" failed: ${err.message}`, err);
                        });
                } catch (err) {
                    throw new NestedError(`Task "${taskKey}" failed: ${err.message}`, err);
                }
            };
            autoTasks[taskKey] = {
                key: taskKey,
                task: task,
                fn: taskRun.bind(this, task)
            };
        }
    }

    protected runTask(task: Task, taskOptions: TaskOptions): Promise<void | Tasks> {
        if (!task.run) {
            return Promise.resolve();
        }
        return task.run(taskOptions);
    }

    private validateTask(taskKey: string, task: Task) {
        if (!task.getPostRequisites
            && !task.getPostRequisites
            && !task.run) {
            throw new Error(`Invalid task: ${taskKey}: ${task}`);
        }
    }
}

function log(taskKey: string, level: string, message?: any, ...optionalParams: any[]): void {
    const args = [`${taskKey}:`];
    if (message) {
        args.push(message);
        if (optionalParams) {
            for (let i = 0; i < optionalParams.length; i++) {
                args.push(optionalParams[i]);
            }
        }
    }
    if (level === 'ERROR') {
        console.error.apply(this, args);
    } else {
        console.log.apply(this, args);
    }
}
