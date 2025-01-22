import {IAuthoringFieldV2, IDateTimeFieldConfig} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IFieldDefinition} from './interfaces';

export function getPlanningDateTimeField(): IFieldDefinition {
    return {
        fieldId: 'planning_date',
        getField: ({id, required}) => {
            const config: IDateTimeFieldConfig = {
                allowSeconds: false,
            };

            const field: IAuthoringFieldV2 = {
                id: id,
                name: superdeskApi.localization.gettext('Planning Date'),
                fieldType: 'datetime',
                fieldConfig: {
                    ...config,
                    required: required,
                },
            };

            return field;
        },
        storageAdapterPlanning: {
            retrieveStoredValue: (item, fieldId) => new Date(item[fieldId]),
            storeValue: (item, operationalValue) => ({
                ...item,
                planning_date: operationalValue,
            })
        }
    };
}
