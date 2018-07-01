import {ProjectOptions} from "./ProjectOptions";

export class Logger {
    private _projectOptions: ProjectOptions;

    constructor(projectOptions: ProjectOptions) {
        this._projectOptions = projectOptions;
    }

    debug(message?: any, ...optionalParams: any[]): void {
        if (this._projectOptions.verbose) {
            console.log(message, ...optionalParams);
        }
    }

    info(message?: any, ...optionalParams: any[]): void {
        if (this._projectOptions.verbose) {
            console.log(message, ...optionalParams);
        }
    }

    warn(message?: any, ...optionalParams: any[]): void {
        console.log(message, ...optionalParams);
    }

    error(message?: any, ...optionalParams: any[]): void {
        console.error(message, ...optionalParams);
    }
}
