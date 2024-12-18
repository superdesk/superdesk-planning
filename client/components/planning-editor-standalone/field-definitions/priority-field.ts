import {IAuthoringFieldV2, IDropdownConfigManualSource} from 'superdesk-api';
import {IFieldDefinition} from './interfaces';
import {planningApi, superdeskApi} from '../../../superdeskApi';

export const getPriorityField = (): IFieldDefinition => {
    const {gettext} = superdeskApi.localization;

    return {
        fieldId: 'priority',
        getField: ({id, required}) => {
            const options = planningApi.redux.store.getState().vocabularies.priority.map((x) => ({
                id: x.qcode,
                label: x.name,
            }));

            const fieldConfig: IDropdownConfigManualSource = {
                source: 'manual-entry',
                options: options,
                roundCorners: true,
                type: 'text',
                multiple: false,
                required: required,
            };

            const field: IAuthoringFieldV2 = {
                id: id,
                name: gettext('Priority'),
                fieldType: 'dropdown',
                fieldConfig: fieldConfig,
            };

            return field;
        },
    };
};
