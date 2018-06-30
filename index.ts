import {ProjectOptions} from "./ProjectOptions";
import {Pango} from "./Pango";

export function run(projectOptions: ProjectOptions): Promise<void> {
    projectOptions.Pango = projectOptions.Pango || Pango;
    const pango: Pango = new projectOptions.Pango();
    return pango.init(projectOptions)
        .then(() => {
            return pango.run(projectOptions);
        })
        .catch(err => {
            if (projectOptions.pangoParsedArgs.verbose) {
                console.error(err);
            } else {
                console.error(err.message ? err.message : err);
            }
            process.exit(err.errorCode || 1);
        });
}

export {ProjectOptions} from "./ProjectOptions";
export {Pango} from "./Pango";
export {Target} from "./Target";
export {Task, Tasks} from "./Task";
export {TaskOptions} from "./TaskOptions";
export {NopTask} from "./NopTask";
export {FileUtils} from "./FileUtils";