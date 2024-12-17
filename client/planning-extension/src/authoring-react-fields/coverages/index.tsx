import {ICustomFieldType} from 'superdesk-api';
import {Editor} from './editor';
import {Preview} from './preview';
import {Difference} from './difference';
import {
    ICoveragesFieldConfig,
    ICoveragesFieldUserPreferences,
    ICoveragesValueOperational,
    ICoveragesValueStorage,
} from './interfaces';
import {superdesk} from '../../superdesk';

const {gettext} = superdesk.localization;

export function getCoveragesField(): ICustomFieldType<
ICoveragesValueOperational,
ICoveragesValueStorage,
ICoveragesFieldConfig,
ICoveragesFieldUserPreferences
> {
    const field: ReturnType<typeof getCoveragesField> = {
        id: 'coverages',
        generic: false,
        label: gettext('Coverages'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => valueOperational != null && valueOperational.length > 0,
        getEmptyValue: () => [],

        differenceComponent: Difference,
        configComponent: () => null,
    };

    return field;
}
