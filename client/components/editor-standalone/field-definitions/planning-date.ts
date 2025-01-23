import {superdeskApi} from '../../../superdeskApi';
import {IFieldDefinition} from './interfaces';
import {getDateTimeField} from './date-time-config';

export const getPlanningDate = (): IFieldDefinition => {
    const {gettext} = superdeskApi.localization;

    return {
        fieldId: 'planning_date',

        getField: ({required, id}) =>
            getDateTimeField({id: id, label: gettext('Planning date'), required: required}),

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
