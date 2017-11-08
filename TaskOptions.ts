import {ProjectOptions} from "./ProjectOptions";

export interface TaskOptions {
    projectOptions: ProjectOptions;
    log: {
        debug: (message?: any, ...optionalParams: any[]) => void;
        info: (message?: any, ...optionalParams: any[]) => void;
        warn: (message?: any, ...optionalParams: any[]) => void;
        error: (message?: any, ...optionalParams: any[]) => void;
    };
}
