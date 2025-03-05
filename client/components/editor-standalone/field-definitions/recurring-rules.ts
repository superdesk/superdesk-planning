import {IAuthoringFieldV2, ICommonFieldConfig} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IFieldDefinition} from './interfaces';

export const getRecurringRulesField = (): IFieldDefinition => {
    return {
        fieldId: 'recurring_rules',
        getField: ({required, id}) => {
            const fieldConfig: ICommonFieldConfig = {
                required: required,
            };

            const field: IAuthoringFieldV2 = {
                id: id,
                name: superdeskApi.localization.gettext('Recurring Rules'),
                fieldType: 'recurring_rules-react',
                fieldConfig: fieldConfig,
            };

            return field;
        },
        storageAdapterEvent: {
            retrieveStoredValue: (item) => {
                return item.dates.recurring_rule;
            },
            storeValue: (item, operationalValue) => {
                return {
                    ...item,
                    dates: {
                        ...item.dates,
                        recurring_rule: operationalValue,
                    },
                };
            }
        }
    };
};
