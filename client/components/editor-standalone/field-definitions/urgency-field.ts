import {IAuthoringFieldV2, IDropdownConfigManualSource} from 'superdesk-api';
import {IFieldDefinition} from './interfaces';
import {planningApi, superdeskApi} from '../../../superdeskApi';

export const URGENCY_CONFIG: Omit<IDropdownConfigManualSource, 'options'> = {
    source: 'manual-entry',
    roundCorners: true,
    type: 'text',
    multiple: false,
};

export const DEFAULT_URGENCY_COLORS = {
    0: '#cccccc',
    1: '#01405b',
    2: '#005e84',
    3: '#3684a4',
    4: '#64a4bf',
    5: '#a1c6d8',
};

export const getUrgencyField = (): IFieldDefinition => {
    const {gettext} = superdeskApi.localization;

    return {
        fieldId: 'urgency',
        getField: ({id, required, language}) => {
            const urgencyVocabulary = planningApi.redux.store.getState().vocabularies.urgency ?? [];

            const options = urgencyVocabulary.map(
                (option) => ({
                    id: option.qcode,
                    label: option.name,
                    color: option.color ?? DEFAULT_URGENCY_COLORS[option.qcode],
                })
            );

            const fieldConfig: IDropdownConfigManualSource = {
                ...URGENCY_CONFIG,
                options: options,
                required: required,
            };

            const field: IAuthoringFieldV2 = {
                id: id,
                name: gettext('Urgency'),
                fieldType: 'dropdown',
                fieldConfig: fieldConfig,
            };

            return field;
        },
    };
};
