import {ICustomFieldType} from 'superdesk-api';
import {Editor} from './editor';
import {Preview} from './preview';
import {
    IContactFieldConfig,
    IContactFieldUserPreferences,
    IContactValueOperational,
    IContactValueStorage,
} from './interfaces';
import {superdesk} from '../../superdesk';

const {gettext} = superdesk.localization;

export function getContactField(): ICustomFieldType<
    IContactValueOperational,
    IContactValueStorage,
    IContactFieldConfig,
    IContactFieldUserPreferences
    > {
    const field: ReturnType<typeof getContactField> = {
        id: 'contact',
        generic: true,
        label: gettext('Contact'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => valueOperational != null && valueOperational.length > 0,
        getEmptyValue: () => [],
        configComponent: () => null,
    };

    return field;
}
