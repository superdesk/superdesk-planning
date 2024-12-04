import {ICommonFieldConfig, ICustomFieldType, IDropdownValue, IVocabulary} from 'superdesk-api';
import {gettext} from 'superdesk-core/scripts/core/utils';
import {Editor} from './editor';
import {Preview} from './preview';
import {ICustomVocabulariesValueOperational} from './interfaces';

export interface ICustomVocabulariesConfig extends ICommonFieldConfig {
    vocabularyIds: Array<IVocabulary['_id']>;
    multiple: boolean;
    filter?(vocabulary: any): boolean;
}

interface CustomVocabulariesFieldType extends ICustomFieldType<
    ICustomVocabulariesValueOperational,
    ICustomVocabulariesValueOperational,
    ICustomVocabulariesConfig,
    never
> { }

export function getCustomVocabulariesField(): CustomVocabulariesFieldType {
    const field: CustomVocabulariesFieldType = {
        id: 'custom_vocabularies',
        generic: true,
        label: gettext('Custom Vocabularies'),
        editorComponent: Editor,
        previewComponent: Preview,
        hasValue: (valueOperational: IDropdownValue) => Array.isArray(valueOperational)
            ? valueOperational.length > 0
            : valueOperational != null,
        getEmptyValue: () => [],
    };

    return field;
}
