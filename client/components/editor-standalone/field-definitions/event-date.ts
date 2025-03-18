import {IAuthoringFieldV2, ICommonFieldConfig} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {cloneDeep} from 'lodash';

export const getEventDateField = () => {
    return {
        fieldId: 'dates',
        getField: ({required, id}) => {
            const fieldConfig: ICommonFieldConfig = {
                required: required,
            };

            const field: IAuthoringFieldV2 = {
                id: id,
                name: superdeskApi.localization.gettext('Event Dates'),
                fieldType: 'dates',
                fieldConfig: fieldConfig,
            };

            return field;
        },
        storageAdapterEvent: {
            storeValue: (item: IEventItem, operationalValue: IEventItem['dates']) => {
                const clonedValue = cloneDeep(operationalValue);

                delete clonedValue.recurring_rule;

                return {
                    ...item,
                    dates: {
                        ...clonedValue,
                        recurring_rule: item.dates.recurring_rule,
                    },
                };
            },
            retrieveStoredValue: (item: IEventItem) => item.dates,
        }
    };
};
