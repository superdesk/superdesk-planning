import {registerEditorField} from './registerEditorFields';

import {superdeskApi} from '../../../superdeskApi';

import {getPriorityQcodes} from '../../../selectors/vocabs';

import {EditorFieldMultilingualText} from '../editor/base/multilingualText';
import {EditorFieldNumberSelect} from '../editor/base/numberSelect';
import {EditorFieldEventAttachments} from '../editor/EventAttachments';

registerEditorField(
    'ednote',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Ed Note'),
        field: 'ednote',
    }),
    null,
    true
);

registerEditorField(
    'internal_note',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Internal Note'),
        field: 'internal_note',
    }),
    null,
    true
);

registerEditorField(
    'name',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Name'),
        field: 'name',
    }),
    null,
    true
);

registerEditorField(
    'slugline',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Slugline'),
        field: 'slugline',
    }),
    null,
    true
);

registerEditorField(
    'files',
    EditorFieldEventAttachments,
    () => ({
        label: superdeskApi.localization.gettext('Attached Files'),
        field: 'files',
    }),
    null,
    false
);

registerEditorField(
    'priority',
    EditorFieldNumberSelect,
    (props) => ({
        label: superdeskApi.localization.gettext('Priority'),
        field: 'priority',
        multiple: false,
    }),
    (state) => ({
        options: getPriorityQcodes(state),
    }),
    false
);
