import {ICustomFieldType} from 'superdesk-api';
import {superdesk} from '../../superdesk';
import {
    IEventDateFieldConfig,
    IEventDateFieldUserPreferences,
    IEventDateValueOperational,
    IEventDateValueStorage
} from './interfaces';
import {Editor} from './editor';
import {Preview} from './preview';

const {gettext} = superdesk.localization;

export function getEventDateField(): ICustomFieldType<
    IEventDateValueOperational,
    IEventDateValueStorage,
    IEventDateFieldConfig,
    IEventDateFieldUserPreferences
    > {
    const field: ReturnType<typeof getEventDateField> = {
        id: 'dates',
        generic: false,
        label: gettext('Event Date'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => Object.keys(valueOperational ?? {}).length > 0,
        getEmptyValue: () => {
            return {} as IEventDateValueOperational;
        },

        configComponent: () => null,
    };

    return field;
}
