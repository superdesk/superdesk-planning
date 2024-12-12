import {ICustomFieldType} from 'superdesk-api';
import {Editor} from './editor';
import {Preview} from './preview';
import {Difference} from './difference';
import {
    IAttachmentsFieldConfig,
    IAttachmentsFieldUserPreferences,
    IAttachmentsValueOperational,
    IAttachmentsValueStorage,
} from './interfaces';
import {superdesk} from '../../superdesk';

const {gettext} = superdesk.localization;

export function getAttachmentsField(): ICustomFieldType<
    IAttachmentsValueOperational,
    IAttachmentsValueStorage,
    IAttachmentsFieldConfig,
    IAttachmentsFieldUserPreferences
    > {
    const field: ReturnType<typeof getAttachmentsField> = {
        id: 'files',
        generic: false,
        label: gettext('Attachments'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => valueOperational != null && valueOperational.length > 0,
        getEmptyValue: () => [],

        differenceComponent: Difference,
        configComponent: () => null,
    };

    return field;
}
