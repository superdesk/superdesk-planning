import {planningConfig} from './config';
import {IPlanningConfig} from './interfaces';

export const setCoverageDueDateStrategy = (callback: IPlanningConfig['coverage']['getDueDateStrategy']) => {
    planningConfig.coverage.getDueDateStrategy = callback;
};
