import pm2 = require('pm2');
import { EventEmitter } from 'events';

type ProcessStatus = NonNullable<NonNullable<pm2.ProcessDescription['pm2_env']>['status']>;

type ExitOptions = {
    cleanup: boolean;
    exit: boolean;
    uncaughtException: boolean;
};

export type ProcessDescriptionSummary = {
    restart_time: number;
    unstable_restarts: number;
    pid: number;
    process_description: pm2.ProcessDescription;
};

export type MonitorEventArguments = {
    name: string; 
    cluster_id: string;
    status: ProcessStatus,
    pm_id: number;
    previous: ProcessDescriptionSummary;
    current: ProcessDescriptionSummary;
};

export interface PM2MonitorEvents {
    initial: (arg: Omit<MonitorEventArguments, 'previous'>) => void;

    changed_state: (arg: { changed_status: { from: ProcessStatus, to: ProcessStatus} } & MonitorEventArguments) => void;
    restarted: (arg: MonitorEventArguments) => void;

    // concrete change state
    online: (arg: MonitorEventArguments) => void;
    launching: (arg: MonitorEventArguments) => void;
    stopping: (arg: MonitorEventArguments) => void;
    stopped: (arg: MonitorEventArguments) => void;
    errored: (arg: MonitorEventArguments) => void;
    "one-launch-status": (arg: MonitorEventArguments) => void;

    // error about monitoring
    monitor_error: (arg: Error) => void;
    exit: () => void;
}

const defaultMonitorInterval = 3000;

function process_description_summary(pi: pm2.ProcessDescription): ProcessDescriptionSummary {
    return {
        restart_time: pi.pm2_env!.restart_time!,
        unstable_restarts: pi.pm2_env!.unstable_restarts!,
        pid: pi.pid!,
        process_description: pi,
    };
}

export type ProcessInfoList = { [key: string]: pm2.ProcessDescription };

export type PM2MonitorOptions = {
    monitoringInterval?: number,
    appFilters?: string[],
    ignorePM2Modules?: boolean,
    startManually?: boolean,
};

export declare interface PM2Monitor {
    on<U extends keyof PM2MonitorEvents>(event: U, listener: PM2MonitorEvents[U]): this;
    once<U extends keyof PM2MonitorEvents>(event: U, listener: PM2MonitorEvents[U]): this;

    emit<U extends keyof PM2MonitorEvents>(event: U, ...args: Parameters<PM2MonitorEvents[U]>): boolean;
}

export class PM2Monitor extends EventEmitter {
    private process_info: ProcessInfoList = {};

    constructor(private options: PM2MonitorOptions = {}) {
        super();
        this.setupExitCallback();
        if(!this.options.startManually) this.start();
    }

    private setupExitCallback() {
        const exitHandler = (options: Partial<ExitOptions>) => {
            if(options.exit) {
                this.emit('exit');
                process.exit();
            }
        }
        process.on('exit', exitHandler.bind(null, { cleanup: true }));
        process.on('SIGINT', exitHandler.bind(null, { exit: true }));
        process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
        process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
        process.on('uncaughtException', exitHandler.bind(null, { uncaughtException: true, exit: true }));
    }

    #is_running = false;
    
    async start() {
        if(this.#is_running) {
            return console.warn('already monitoring was started');
        }
        this.#is_running = true;
        pm2.connect(async (err) =>{
            if(err) {
                throw err;
            }

            while(this.#is_running) {
                try {
                    const new_process_info = await new Promise<ProcessInfoList>((resolve, reject) => {
                        pm2.list((err, processes) => {
                            if(err) {
                                return reject(err);
                            }
                            const new_process_info: ProcessInfoList = {};
                            processes.forEach(process => {
                                if(this.options.ignorePM2Modules && process.pm2_env && (process.pm2_env as any).axm_options?.isModule) return;
                                if(this.options.appFilters == null || this.options.appFilters.find(name => name == process.name)) {
                                    new_process_info[`${process.pm_id}-${process.name}`] = process;
                                }
                            });
                            resolve(new_process_info);
                        });
                    });
                    for(const key in new_process_info) {
                        const previous_pi = this.process_info[key];
                        const current_pi = new_process_info[key];
                        if(previous_pi) {
                            if(previous_pi.pm2_env && current_pi.pm2_env) {
                                if(previous_pi.pm2_env.status
                                    && current_pi.pm2_env.status
                                    && previous_pi.pm2_env.status != current_pi.pm2_env.status
                                ) {
                                    const arg = {
                                        name: current_pi.name!,
                                        status: current_pi.pm2_env!.status!,
                                        cluster_id: (current_pi.pm2_env as any).NODE_APP_INSTANCE as string,
                                        pm_id: current_pi.pm_id!,
                                        previous: process_description_summary(previous_pi),
                                        current: process_description_summary(current_pi),
                                    };
                                    this.emit(current_pi.pm2_env.status, arg);
                                    this.emit('changed_state', {
                                        changed_status: {
                                            from: previous_pi.pm2_env.status,
                                            to: current_pi.pm2_env.status,
                                        },
                                        ... arg
                                    });
                                }
                                else if(previous_pi.pm2_env.restart_time! < current_pi.pm2_env!.restart_time!) {
                                    this.emit('restarted', {
                                        name: current_pi.name!,
                                        status: current_pi.pm2_env!.status!,
                                        cluster_id: (current_pi.pm2_env as any).NODE_APP_INSTANCE as string,
                                        pm_id: current_pi.pm_id!,
                                        previous: process_description_summary(previous_pi),
                                        current: process_description_summary(current_pi),
                                    });
                                }
                            }
                        } else {
                            this.emit('initial', {
                                name: current_pi.name!,
                                status: current_pi.pm2_env!.status!,
                                cluster_id: (current_pi.pm2_env as any).NODE_APP_INSTANCE as string,
                                pm_id: current_pi.pm_id!,
                                current: process_description_summary(current_pi),
                            });
                        }
                        this.process_info[key] = current_pi;
                    }
                } catch(err) {
                    console.error(err);
                    this.emit('monitor_error', err);
                }
                await new Promise(r => setTimeout(r, this.options.monitoringInterval || defaultMonitorInterval));
            }
        });
    }

    stop() {
        if(!this.#is_running) {
            return console.warn('already monitoring was stopped');
        }
        this.#is_running = false;
    }

    get currentProcessInfo(): ProcessInfoList {
        return this.process_info;
    }
};
