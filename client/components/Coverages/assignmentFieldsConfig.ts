import {IPlanningConfig} from 'interfaces';
import {appConfig} from 'superdesk-core/scripts/appConfig';

export const assignmentFieldsConfig = {
    assignmentPriority: (appConfig as IPlanningConfig).coverage?.assignments?.fields?.assignmentPriority ?? true,
    coverageProvider: (appConfig as IPlanningConfig).coverage?.assignments?.fields?.coverageProvider ?? true,
};
