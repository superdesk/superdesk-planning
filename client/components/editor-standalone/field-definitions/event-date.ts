import {IAuthoringFieldV2, ICommonFieldConfig} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {cloneDeep} from 'lodash';
import {TO_BE_CONFIRMED_FIELD} from '../../../constants';

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

                delete clonedValue[TO_BE_CONFIRMED_FIELD];

                // PR-TODO: Convert all date type fields in dates to iso string,
                // respectively back to moment in retrieval
                return {
                    ...item,
                    dates: clonedValue,
                };
            },
            retrieveStoredValue: (item: IEventItem) => item.dates,
        }
    };
};
