import {IAuthoringFieldV2, IDateTimeFieldConfig} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IFieldDefinition} from './interfaces';
import moment from 'moment';

export function getPlanningDateField(): IFieldDefinition {
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
            retrieveStoredValue: (item, fieldId) => {
                if (typeof item[fieldId] === 'object') {
                    return (item[fieldId] as moment.Moment).toString();
                }

                return item[fieldId];
            },
            storeValue: (item, operationalValue) => {
                return {
                    ...item,
                    planning_date: operationalValue,
                };
            }
        }
    };
}
