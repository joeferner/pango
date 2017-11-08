import {ProjectOptions} from "./ProjectOptions";
import {Tasks} from "./Task";

export abstract class Target {
    get helpMessage(): string {
        return '';
    }

    abstract getTasks(projectOptions: ProjectOptions): Promise<Tasks>;
}
