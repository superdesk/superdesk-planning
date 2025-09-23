import {IPlanningExportTemplate} from '../interfaces';

export interface IExportTemplatesState {
    exportTemplates: Array<IPlanningExportTemplate>;
}

const initialState: IExportTemplatesState = {
    exportTemplates: [],
};

const exportTemplates = (state = initialState, action) => {
    switch (action.type) {
    case 'UPDATE_EXPORT_TEMPLATES': {
        return action.payload;
    }
    default:
        return state;
    }
};

export default exportTemplates;
