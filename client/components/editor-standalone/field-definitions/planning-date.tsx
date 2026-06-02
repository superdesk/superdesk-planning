import React from 'react';
import {appConfig} from 'superdesk-core/scripts/appConfig';
import {superdeskApi} from '../../../superdeskApi';
import {IFieldDefinition} from './interfaces';
import {IAuthoringFieldV2, IDateTimeFieldConfig} from 'superdesk-api';
import {TimeHeader} from './field-components/time-header-common';

export const getPlanningDate = (): IFieldDefinition => {
    const {gettext} = superdeskApi.localization;

    return {
        fieldId: 'planning_date',

        getField: ({id, required}) => {
            const config: IDateTimeFieldConfig = {
                allowSeconds: false,
                // eslint-disable-next-line react/display-name
                getTimeHeaderTemplate: (value, onChange) => (
                    <TimeHeader value={value} onChange={onChange} />
                ),
            };

            const field: IAuthoringFieldV2 = {
                id: id,
                name: gettext('Planning Date'),

                // time picker must not be displayed for all day planning
                fieldType: appConfig.planning.all_day ? 'date' : 'datetime-v2',

                fieldConfig: {
                    ...config,
                    required: required,
                },
            };

            return field;
        },

        /**
         * Make compatible accepting a moment date as an input.
         * Will output a native Date.
         */
        storageAdapterPlanning: {
            retrieveStoredValue: (item, fieldId) => {
                const val = item[fieldId];

                if (val?._isAMomentObject === true) {
                    return val.toDate();
                } else if (typeof val === 'string') {
                    return new Date(val);
                } else {
                    return val;
                }
            },
            storeValue: (item, operationalValue: Date | string) => {
                if (operationalValue == null) {
                    return {...item, planning_date: null};
                }

                // If field type is date, operational value is ISO string date
                const dateValue = operationalValue instanceof Date
                    ? operationalValue
                    : new Date(operationalValue);

                return {
                    ...item,
                    planning_date: dateValue.toISOString(),
                };
            },
        },
    };
};
