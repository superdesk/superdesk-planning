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
import {extensionBridge} from '../../extension_bridge';

const {gettext} = superdesk.localization;

export function getCoveragesField(): ICustomFieldType<
ICoveragesValueOperational,
ICoveragesValueStorage,
ICoveragesFieldConfig,
ICoveragesFieldUserPreferences
> {
    const {validateCoverages} = extensionBridge.coverages;

    const field: ReturnType<typeof getCoveragesField> = {
        id: 'coverages',
        generic: false,
        label: gettext('Coverages'),
        editorComponent: Editor,
        previewComponent: Preview,

        hasValue: (valueOperational) => valueOperational != null && valueOperational.length > 0,

        validate: (value) => value.length < 1 ? null : validateCoverages(value).messages[0] ?? null,

        getEmptyValue: () => [],

        differenceComponent: Difference,
        configComponent: () => null,
    };

    return field;
}
