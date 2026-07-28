import {IAuthoringFieldV2, IDropdownConfigManualSource, IVocabularyItem} from 'superdesk-api';
import {IFieldDefinition} from './interfaces';
import {planningApi, superdeskApi} from '../../../superdeskApi';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';

export const PRIORITY_CONFIG: Omit<IDropdownConfigManualSource, 'options'> = {
    source: 'manual-entry',
    roundCorners: false,
    type: 'text',
    multiple: false,
};

export const DEFAULT_PRIORITY_COLORS: {[qcode: number]: string} = {
    1: '#d33c44',
    2: '#ff6900',
    3: '#f5a623',
    4: '#7ac142',
    5: '#6bb0f5',
    6: '#9013fe',
};

export const getPriorityField = (): IFieldDefinition => {
    const {gettext} = superdeskApi.localization;

    return {
        fieldId: 'priority',
        getField: ({id, required, language}) => {
            const priorityVocabulary = planningApi.redux.store.getState().vocabularies.priority ?? [];
            const options = priorityVocabulary.map(
                (option) => ({
                    id: option.qcode,
                    label: getVocabularyItemFieldTranslated(
                        option,
                        superdeskApi.helpers.nameof<IVocabularyItem>('label'),
                        language,
                        superdeskApi.helpers.nameof<IVocabularyItem>('name'),
                    ),
                    color: option.color ?? DEFAULT_PRIORITY_COLORS[option.qcode],
                })
            );

            const fieldConfig: IDropdownConfigManualSource = {
                ...PRIORITY_CONFIG,
                options: options,
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
