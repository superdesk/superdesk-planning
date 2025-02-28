import {IAuthoringFieldV2, IDropdownConfigManualSource} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../../superdeskApi';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';
import {calendars} from '../../../selectors/events';

export const getCalendarsField = () => {
    const vocabularyFromStore = calendars(planningApi.redux.store.getState());

    return {
        fieldId: 'calendars',
        getField: ({required, id}) => {
            const options = vocabularyFromStore.map(
                (option) => ({
                    id: option.qcode,
                    label: getVocabularyItemFieldTranslated(
                        option,
                        'label',
                        'en',
                        'name'
                    ),
                })
            );

            const fieldConfig: IDropdownConfigManualSource = {
                source: 'manual-entry',
                options: options,
                type: 'text',
                roundCorners: false,
                multiple: true,
                required: required,
            };

            const field: IAuthoringFieldV2 = {
                id: id,
                name: superdeskApi.localization.gettext('Calendars'),
                fieldType: 'dropdown',
                fieldConfig: fieldConfig,
            };

            return field;
        },
        storageAdapterEvent: {
            storeValue: (item, operationalValue: Array<string>) => {
                return {
                    ...item,
                    calendars: vocabularyFromStore.filter((x) => operationalValue.includes(x.qcode)),
                };
            },
            retrieveStoredValue: (item) => item.calendars.map((x) => x.qcode),
        }
    };
};
