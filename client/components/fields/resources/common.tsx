/* eslint-disable react/no-multi-comp */
import {registerEditorField} from './registerEditorFields';
import {superdeskApi} from '../../../superdeskApi';
import {getPrioritiesForTreeSelect, getUrgenciesForTreeSelect} from '../../../selectors/vocabs';
import {EditorFieldMultilingualText} from '../editor/base/multilingualText';
import {EditorFieldTreeSelect} from '../editor/base/treeSelect';
import {EditorFieldEventAttachments} from '../editor/EventAttachments';
import {DropdownItemTemplate} from '../editor/dropDownTemplate';
import React from 'react';

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
    EditorFieldTreeSelect,
    (props) => ({
        label: superdeskApi.localization.gettext('Priority'),
        field: 'priority',
        allowMultiple: false,
        valueAsString: true,
        getId: (item: any) => item.qcode,
        getLabel: (item: any) => item.name,
        getOptions: () => [],
        getValue: (item: any, field: string) => {
            const value = item[field];

            return (value !== null && value !== undefined && value !== '') ? [value] : [];
        },
        onSelectionChange: (field: string, values: Array<string>) => {
            const newValue = values && values.length > 0 ? values[0] : null;

            props.onChange(field, newValue);
        },
        // eslint-disable-next-line react/display-name
        optionTemplate: (item: any) => (
            <DropdownItemTemplate
                option={{
                    id: item.qcode,
                    label: item.name,
                    color: item.color
                }}
                config={item.fieldConfig}
                noPadding={false}
            />
        ),
    }),
    (state) => ({
        getOptions: () => getPrioritiesForTreeSelect(state),
    }),
    false
);

registerEditorField(
    'urgency',
    EditorFieldTreeSelect,
    (props) => ({
        label: superdeskApi.localization.gettext('Urgency'),
        field: 'urgency',
        allowMultiple: false,
        valueAsString: true,
        getId: (item: any) => item.qcode,
        getLabel: (item: any) => item.name,
        getOptions: () => [],
        getValue: (item: any, field: string) => {
            const value = item[field];

            return (value !== null && value !== undefined && value !== '') ? [value] : [];
        },
        onSelectionChange: (field: string, values: Array<string>) => {
            const newValue = values && values.length > 0 ? values[0] : null;

            props.onChange(field, newValue);
        },
        // eslint-disable-next-line react/display-name
        optionTemplate: (item: any) => (
            <DropdownItemTemplate
                option={{
                    id: item.qcode,
                    label: item.name,
                    color: item.color
                }}
                config={item.fieldConfig}
                noPadding={false}
            />
        ),
    }),
    (state) => ({
        getOptions: () => getUrgenciesForTreeSelect(state),
    }),
    false
);
