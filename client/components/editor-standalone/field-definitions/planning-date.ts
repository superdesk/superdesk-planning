import {superdeskApi} from '../../../superdeskApi';
import {IFieldDefinition} from './interfaces';
import {IAuthoringFieldV2, IDateTimeFieldConfig} from 'superdesk-api';

export const getPlanningDate = (): IFieldDefinition => {
    const {gettext} = superdeskApi.localization;

    return {
        fieldId: 'planning_date',

        getField: ({id, required}) => {
            const config: IDateTimeFieldConfig = {
                allowSeconds: false,
            };

            const field: IAuthoringFieldV2 = {
                id: id,
                name: gettext('Planning Date'),
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
            storeValue: (item, operationalValue: Date) => {
                return {
                    ...item,
                    planning_date: operationalValue == null ? null : operationalValue.toISOString(),
                };
            },
        },
    };
};
