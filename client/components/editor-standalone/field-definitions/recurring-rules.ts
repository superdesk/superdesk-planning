import {IAuthoringFieldV2, ICommonFieldConfig} from 'superdesk-api';
import {IFieldDefinition} from './interfaces';
import {cloneDeep} from 'lodash';
import moment, {Moment} from 'moment';
import {IEventItem} from 'globals';

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
                return cloneDeep(item.dates.recurring_rule);
            },
            storeValue: (item, operationalValue: NonNullable<IEventItem['dates']>['recurring_rule']) => {
                return {
                    ...item,
                    dates: {
                        ...item.dates,
                        recurring_rule: cloneDeep(operationalValue),
                    },
                };
            }
        }
    };
};
