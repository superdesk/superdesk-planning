import {ICalendar} from 'interfaces';
import {IAuthoringFieldV2, IDropdownConfigManualSource} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../../superdeskApi';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';
import {calendars} from '../../../selectors/events';
import {IFieldDefinition} from './interfaces';

export const getCalendarsField = (): IFieldDefinition => {
    const vocabularyFromStore: Array<ICalendar> = calendars(planningApi.redux.store.getState());

    return {
        fieldId: 'calendars',
        getField: ({required, id, language}) => {
            const options = vocabularyFromStore.map(
                (option) => ({
                    id: option.qcode,
                    label: getVocabularyItemFieldTranslated(
                        option,
                        superdeskApi.helpers.nameof<ICalendar>('name'),
                        language,
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
            retrieveStoredValue: (item) => (item.calendars ?? []).map((x) => x.qcode),
        }
    };
};
