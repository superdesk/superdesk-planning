import {ExportTemplatesActions} from '../constants/exportTemplates';
import {IPlanningExportTemplate} from '../interfaces';

export const updateTemplates = (updatedTemplates: Array<IPlanningExportTemplate>) => ({
    type: ExportTemplatesActions.UPDATE_EXPORT_TEMPLATES,
    payload: updatedTemplates,
});
