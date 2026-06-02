import {ICustomFieldType} from 'superdesk-api';
import {Editor} from './editor';
import {Preview} from './preview';
import {
    ILocationFieldConfig,
    ILocationFieldUserPreferences,
    ILocationValueOperational,
    ILocationValueStorage,
} from './interfaces';
import {superdesk} from '../../superdesk';

const {gettext} = superdesk.localization;

type IReturnType = ICustomFieldType<
    ILocationValueOperational,
    ILocationValueStorage,
    ILocationFieldConfig,
    ILocationFieldUserPreferences
>;

export function getLocationField(): IReturnType {
    const field: ReturnType<typeof getLocationField> = {
        id: 'location',
        generic: false,
        label: gettext('Location'),
        editorComponent: Editor,
        previewComponent: Preview,
        hasValue: (valueOperational) => valueOperational != null && valueOperational.length > 0,
        getEmptyValue: () => [],
        configComponent: () => null,
    };

    return field;
}
