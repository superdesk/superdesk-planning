import {IAuthoringFieldV2, ICommonFieldConfig} from 'superdesk-api';
import {IFieldDefinition} from './interfaces';
import {cloneDeep} from 'lodash';
import moment, {Moment} from 'moment';

export const getRecurringRulesField = (): IFieldDefinition => {
    return {
        fieldId: 'recurring_rules',
        getField: ({required, id}) => {
            const fieldConfig: ICommonFieldConfig = {
                required: required,
            };

            const field: IAuthoringFieldV2 = {
                id: id,
                name: '', // Put an empty label to follow design, since label on the toggle is used
                fieldType: 'recurring_rules-react',
                fieldConfig: fieldConfig,
            };

            return field;
        },
        storageAdapterEvent: {
            retrieveStoredValue: (item) => {
                const clonedValue = cloneDeep(item.dates.recurring_rule);

                if (clonedValue?.until != null) {
                    clonedValue.until = moment(clonedValue.until);
                }

                return clonedValue;
            },
            storeValue: (item, operationalValue: NonNullable<IEventItem['dates']>['recurring_rule']) => {
                const clonedValue = cloneDeep(operationalValue);

                if (clonedValue?.until != null) {
                    clonedValue.until = (clonedValue.until as Moment).toISOString();
                }

                return {
                    ...item,
                    dates: {
                        ...item.dates,
                        recurring_rule: clonedValue,
                    },
                };
            }
        }
    };
};
