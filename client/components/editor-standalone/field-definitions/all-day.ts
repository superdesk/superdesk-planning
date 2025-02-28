import {IAuthoringFieldV2, ICommonFieldConfig} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import moment from 'moment';

export const getAllDayDatesField = () => {
    return {
        fieldId: 'dates',
        getField: ({required, id}) => {
            const fieldConfig: ICommonFieldConfig = {
                required: required,
            };

            const field: IAuthoringFieldV2 = {
                id: id,
                name: superdeskApi.localization.gettext('All Day'),
                fieldType: 'boolean',
                fieldConfig: fieldConfig,
            };

            return field;
        },
        storageAdapterEvent: {
            storeValue: (item: IEventItem, operationalValue: boolean | undefined) => {
                const dates = item.dates ?? {};
                let newStart, newEnd;

                newStart = moment((dates.start ?? (dates.tz ? moment.tz(dates.tz) : moment())))
                    .startOf('day');

                // If allDay is enabled, then set the event to all day
                if (operationalValue) {
                    newEnd = moment(dates.end ?? (dates.tz ? moment.tz(dates.tz) : moment()))
                        .endOf('day');
                } else {
                    // If allDay is disabled, then set the new dates to
                    // the initial values since last save and time to empty
                    newEnd = moment(dates?.end ?? newStart)
                        .hour(0)
                        .minute(1);
                }

                // TODO: Figure out support for _startTime _endTime, _time_to_be_confirmed fields
                return {
                    ...item,
                    dates: {
                        ...item.dates,
                        start: newStart,
                        end: newEnd,
                        all_day: operationalValue,
                    }
                };
            },
            retrieveStoredValue: (item: IEventItem) => item.dates.all_day,
        }
    };
};
