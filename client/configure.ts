import {ISuperdeskGlobalConfig} from 'superdesk-api';
import {appConfig} from 'appConfig';

export const setCoverageDueDateStrategy = (callback: ISuperdeskGlobalConfig['coverage']['getDueDateStrategy']) => {
    appConfig.coverage.getDueDateStrategy = callback;
};
