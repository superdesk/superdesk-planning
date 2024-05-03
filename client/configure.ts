import {planningConfig} from './config';
import {IPlanningConfig} from './interfaces';

export const setCoverageDueDateCallback = (callback: IPlanningConfig['coverage']['getDueDate']) => {
    planningConfig.coverage.getDueDate = callback;
};
