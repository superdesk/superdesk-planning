import {registerEditorField} from './registerEditorFields';

import {superdeskApi} from '../../../superdeskApi';

import {EditorFieldMultilingualText} from '../editor/base/multilingualText';
import {EditorFieldToggle} from '../editor/base/toggle';

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

registerEditorField(
    'multiple_content',
    EditorFieldToggle,
    () => ({
        label: superdeskApi.localization.gettext('Multiple Content'),
        field: 'planning.multiple_content',
    })
);
