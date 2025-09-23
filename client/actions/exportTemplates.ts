import {IPlanningExportTemplate} from '../interfaces';

export const updateTemplates = (updatedTemplates: Array<IPlanningExportTemplate>) => ({
    type: 'UPDATE_EXPORT_TEMPLATES',
    payload: updatedTemplates,
});
