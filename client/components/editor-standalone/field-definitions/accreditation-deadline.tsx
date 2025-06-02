import React from 'react';
import {superdeskApi} from '../../../superdeskApi';
import {IFieldDefinition} from './interfaces';
import {IAuthoringFieldV2, IDateTimeFieldConfig} from 'superdesk-api';
import {TimeHeader} from './field-components/time-header-common';

export const getAccreditationDeadline = (): IFieldDefinition => {
    const {gettext} = superdeskApi.localization;

    return {
        fieldId: 'accreditation_deadline',

        getField: ({id, required}) => {
            const config: IDateTimeFieldConfig = {
                allowSeconds: false,
                // eslint-disable-next-line react/display-name
                getTimeHeaderTemplate: (value, onChange) => (
                    <TimeHeader value= {value} onChange={onChange} />
                ),
            };

            const field: IAuthoringFieldV2 = {
                id: id,
                name: gettext('Accreditation Deadline'),
                fieldType: 'datetime-v2',
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
        storageAdapterEvent: {
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
            storeValue: (item, operationalValue: string) => ({
                ...item,
                accreditation_deadline: operationalValue ? new Date(operationalValue) : null,
            }),
        },
    };
};
