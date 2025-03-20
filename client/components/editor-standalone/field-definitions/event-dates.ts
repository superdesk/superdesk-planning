import {IAuthoringFieldV2, ICommonFieldConfig} from 'superdesk-api';
import {TO_BE_CONFIRMED_FIELD} from '../../../constants';
import {superdeskApi} from '../../../superdeskApi';
import {cloneDeep} from 'lodash';
import moment, {isMoment, Moment} from 'moment';
import {IFieldDefinition} from './interfaces';

export const getEventDateField = (): IFieldDefinition => {
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
            storeValue: (
                item: IEventItem,
                operationalValue: Pick<IEventItem, 'dates' | '_time_to_be_confirmed' | '_startTime' | '_endTime'>,
            ) => {
                const clonedValue = cloneDeep(operationalValue);

                return {
                    ...item,
                    ...clonedValue,
                    dates: {
                        ...clonedValue.dates,
                        start: isMoment(clonedValue.dates.start)
                            ? (clonedValue.dates.start as unknown as Moment).toISOString()
                            : clonedValue.dates.start,
                        end: isMoment(clonedValue.dates.end)
                            ? (clonedValue.dates.end as unknown as Moment).toISOString()
                            : clonedValue.dates.end,
                        recurring_rule: item.dates.recurring_rule,
                    },
                };
            },
            retrieveStoredValue: (item: IEventItem) => {
                const start = isMoment(item.dates.start)
                    ? item.dates.start
                    : moment(item.dates.start);
                const end = isMoment(item.dates.end)
                    ? item.dates.end
                    : moment(item.dates.end);

                return {
                    dates: {
                        ...item.dates,
                        start: start,
                        end: end,
                    },
                    _startTime: start,
                    _endTime: end,
                    [TO_BE_CONFIRMED_FIELD]: item[TO_BE_CONFIRMED_FIELD],
                };
            },
        }
    };
};
