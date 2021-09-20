import {registerEditorField} from './registerEditorFields';

import {superdeskApi} from '../../../superdeskApi';

import {EditorFieldDynamicTextType} from '../editor/base/dynamicTextTypeField';

registerEditorField(
    'ednote',
    EditorFieldDynamicTextType,
    () => ({
        label: superdeskApi.localization.gettext('Ed Note'),
        field: 'ednote',
    }),
    null,
    true
);

registerEditorField(
    'internal_note',
    EditorFieldDynamicTextType,
    () => ({
        label: superdeskApi.localization.gettext('Internal Note'),
        field: 'internal_note',
    }),
    null,
    true
);

registerEditorField(
    'name',
    EditorFieldDynamicTextType,
    () => ({
        label: superdeskApi.localization.gettext('Name'),
        field: 'name',
    }),
    null,
    true
);

registerEditorField(
    'slugline',
    EditorFieldDynamicTextType,
    () => ({
        label: superdeskApi.localization.gettext('Slugline'),
        field: 'slugline',
    }),
    null,
    true
);
