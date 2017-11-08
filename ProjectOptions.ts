import {Target} from "./Target";

export interface PangoParsedArgs {
    verbose: boolean;
    concurrency?: number;
}

export interface ProjectOptions {
    Pango?: any;
    projectDir: string;
    target?: string;
    buildDir?: string;
    sourceFiles?: string[];
    sourceDirs?: string[];
    includeDirs?: string[];
    args?: string[];
    pangoArgs?: string[];
    pangoParsedArgs?: PangoParsedArgs;
    targetArgs?: string[];
    targets?: { [name: string]: Target; };

    [x: string]: any;
}