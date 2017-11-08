import {Task} from "./Task";
import {ProjectOptions} from "./ProjectOptions";

type AutoTaskFn = () => Promise<void>;

export interface AutoTask {
    key: string;
    task: Task;
    fn: AutoTaskFn;
    additionalPrerequisites?: string[];
}

export interface AutoTasks {
    [name: string]: AutoTask;
}

interface AutoOptions {
    verbose: boolean,
    log: (message?: any, ...optionalParams: any[]) => void;
    projectOptions: ProjectOptions;
}

export function auto(items: AutoTasks, options: AutoOptions): Promise<void> {
    const completedItems = new Set<string>();
    return doAuto(items, completedItems, options)
        .then(() => {
            if (Object.keys(items).length !== completedItems.size) {
                const taskKeysRemaining = getRemainingTasks(items, completedItems);
                const messageItems = [];
                for (const taskKey of Array.from(taskKeysRemaining)) {
                    const prerequisites = getPrerequisitesRemainingForTask(options.projectOptions, items, taskKey, completedItems);
                    messageItems.push(`${taskKey} (${Array.from(prerequisites)})`)
                }
                throw new Error(`Could not resolve all tasks [${messageItems}]`);
            }
        });
}

function doAuto(autoTasks: AutoTasks, completedItems: Set<string>, options: AutoOptions): Promise<void> {
    if (options.verbose) {
        options.log(`remaining ${Array.from(getRemainingTasks(autoTasks, completedItems))}`);
    }
    let todoTasks: AutoTask[] = [];
    updateAdditionalPrerequisites(autoTasks, completedItems, options);
    for (const key of Object.keys(autoTasks)) {
        if (completedItems.has(key)) {
            continue;
        }
        const autoTask = autoTasks[key];
        if (prereqsMet(options.projectOptions, autoTask, completedItems)) {
            todoTasks.push(autoTask);
        }
    }
    if (todoTasks.length === 0) {
        return Promise.resolve();
    }
    const concurrency = options.projectOptions.pangoParsedArgs.concurrency;
    if (concurrency) {
        todoTasks = todoTasks.slice(0, concurrency);
    }
    return Promise.all(todoTasks.map(todoTask => todoTask.fn()))
        .then(() => {
            for (const todoTask of todoTasks) {
                completedItems.add(todoTask.key);
            }
            return doAuto(autoTasks, completedItems, options);
        });
}

function prereqsMet(
    projectOptions: ProjectOptions,
    autoTask: AutoTask,
    completedItems: Set<string>
): boolean {
    const prerequisites = autoTask.task.getPrerequisites
        ? autoTask.task.getPrerequisites(projectOptions)
        : [];
    Array.prototype.push.apply(prerequisites, autoTask.additionalPrerequisites || []);
    for (let key of prerequisites) {
        if (key.endsWith('?')) {
            key = key.substr(0, key.length - 1);
        }
        if (!completedItems.has(key)) {
            return false;
        }
    }
    return true;
}

function updateAdditionalPrerequisites(autoTasks: AutoTasks, completedItems: Set<string>, options: AutoOptions) {
    for (const key of Object.keys(autoTasks)) {
        if (completedItems.has(key)) {
            continue;
        }
        const autoTask = autoTasks[key];
        const postReqs = autoTask.task.getPostRequisites
            ? autoTask.task.getPostRequisites(options.projectOptions) || []
            : [];
        for (const postReq of postReqs) {
            const add = autoTasks[postReq].additionalPrerequisites = autoTasks[postReq].additionalPrerequisites || [];
            if (add.indexOf(key) < 0) {
                add.push(key);
            }
        }
    }
}

function getRemainingTasks(autoTasks: AutoTasks, completedItems: Set<string>): Set<string> {
    const taskKeysRemaining: Set<string> = new Set();
    for (const key of Object.keys(autoTasks)) {
        taskKeysRemaining.add(key);
    }
    for (const key of Array.from(completedItems)) {
        taskKeysRemaining.delete(key);
    }
    return taskKeysRemaining;
}

function getPrerequisitesRemainingForTask(
    projectOptions: ProjectOptions,
    autoTasks: AutoTasks,
    taskKey: string,
    completedItems: Set<string>
): Set<string> {
    const prerequisites = new Set<string>();
    const autoTask = autoTasks[taskKey];
    const taskPrerequisites = autoTask.task.getPrerequisites(projectOptions);
    for (const taskPrerequisite of taskPrerequisites) {
        prerequisites.add(taskPrerequisite);
    }
    for (const completedKey of Array.from(completedItems)) {
        prerequisites.delete(completedKey);
        prerequisites.delete(completedKey + '?');
    }
    return prerequisites;
}
