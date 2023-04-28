import {registerEditorField} from './registerEditorFields';

import {superdeskApi} from '../../../superdeskApi';

import {EditorFieldMultilingualText} from '../editor/base/multilingualText';

registerEditorField(
    'description_text',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Description'),
        field: 'description_text',
    }),
    null,
    true
);
registerEditorField(
    'headline',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Headline'),
        field: 'headline',
    }),
    null,
    true
);
