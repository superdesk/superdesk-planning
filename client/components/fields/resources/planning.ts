import {registerEditorField} from './registerEditorFields';

import {superdeskApi} from '../../../superdeskApi';

import {EditorFieldDynamicTextType} from '../editor/base/dynamicTextTypeField';

registerEditorField(
    'description_text',
    EditorFieldDynamicTextType,
    () => ({
        label: superdeskApi.localization.gettext('Description'),
        field: 'description_text',
    }),
    null,
    true
);
registerEditorField(
    'headline',
    EditorFieldDynamicTextType,
    () => ({
        label: superdeskApi.localization.gettext('Headline'),
        field: 'headline',
    }),
    null,
    true
);
