import {registerEditorField} from './registerEditorFields';

import {ICalendar} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {getVocabularyItemNameFromString} from '../../../utils/vocabularies';
import {enabledCalendars} from '../../../selectors/events';

import {EditorFieldMultilingualText} from '../editor/base/multilingualText';
import {EditorFieldDateTime} from '../editor/base/dateTime';
import {EditorFieldEventLinks} from '../editor/EventLinks';
import {EditorFieldEventRelatedItems} from '../editor/EventRelatedArticles/EditorFieldEventRelatedItems';
import {EditorFieldTreeSelect, IEditorFieldTreeSelectProps} from '../editor/base/treeSelect';

registerEditorField(
    'definition_long',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Long Description'),
        field: 'definition_long',
    }),
    null,
    true
);

registerEditorField(
    'definition_short',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Description'),
        field: 'definition_short',
    }),
    null,
    true
);

registerEditorField(
    'reference',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Reference'),
        field: 'reference',
    }),
    null,
    true
);

registerEditorField(
    'links',
    EditorFieldEventLinks,
    () => ({
        label: superdeskApi.localization.gettext('Links'),
        field: 'links',
    }),
    null,
    false
);

registerEditorField(
    'registration_details',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Registration Details'),
        field: 'registration_details',
    }),
    null,
    false,
);

registerEditorField(
    'invitation_details',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Invitation Details'),
        field: 'invitation_details',
    }),
    null,
    false,
);

registerEditorField(
    'accreditation_info',
    EditorFieldMultilingualText,
    () => ({
        label: superdeskApi.localization.gettext('Accreditation Info'),
        field: 'accreditation_info',
    }),
    null,
    false,
);

registerEditorField(
    'accreditation_deadline',
    EditorFieldDateTime,
    () => ({
        label: superdeskApi.localization.gettext('Accreditation Deadline'),
        field: 'accreditation_deadline',
        singleValue: true,
    }),
    null,
    false,
);

registerEditorField(
    'related_items',
    EditorFieldEventRelatedItems,
    () => ({
        label: superdeskApi.localization.gettext('Related Articles'),
        field: 'related_items',
        singleValue: true,
    }),
    null,
    false,
);

registerEditorField<IEditorFieldTreeSelectProps, {calendars: Array<ICalendar>}>(
    'calendars',
    EditorFieldTreeSelect,
    (props) => ({
        field: 'calendars',
        label: superdeskApi.localization.gettext('Calendars'),
        required: props.required ?? props.schema?.required,
        allowMultiple: true,
        sortable: true,
        getOptions: () => props.calendars.map((calendar) => ({value: calendar})),
        getId: (item: ICalendar) => item.qcode,
        getLabel: (item: ICalendar) => (
            getVocabularyItemNameFromString(
                item.qcode,
                props.calendars,
                'qcode',
                'name',
                props.language,
            )
        ),

    }),
    (state) => ({
        calendars: enabledCalendars(state),
    }),
    false
);
