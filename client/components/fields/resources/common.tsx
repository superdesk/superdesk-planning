/* eslint-disable react/no-multi-comp */
import React from 'react';
import {get} from 'lodash';

import {IVocabularyItem} from 'superdesk-api';

import {getVocabularyItemNameFromString} from '../../../utils/vocabularies';

import {registerEditorField} from './registerEditorFields';
import {superdeskApi} from '../../../superdeskApi';
import {
    getPrioritiesForTreeSelect,
    getUrgenciesForTreeSelect,
    getCategoriesForTreeSelect,
} from '../../../selectors/vocabs';
import {EditorFieldMultilingualText} from '../editor/base/multilingualText';
import {EditorFieldTreeSelect} from '../editor/base/treeSelect';
import {EditorFieldEventAttachments} from '../editor/EventAttachments';
import {DropdownItemTemplate} from '../editor/dropDownTemplate';
import {EditorFieldUser} from '../editor/User';

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
        valueAdapter: {
            getValue: (item: any, field: string) => {
                const value = get(item, field);

                return (value !== null && value !== undefined && value !== '') ? [value] : [];
            },
            prepareValueForStorage: (values) => {
                if (values.length < 1) {
                    return null;
                }

                return (values[0] as any)?.qcode;
            },
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
        valueAdapter: {
            getValue: (item, field) => {
                const value = get(item, field);

                return (value !== null && value !== undefined && value !== '') ? [value] : [];
            },
            prepareValueForStorage: (values, valueAsString) => {
                if (values.length < 1) {
                    return null;
                }

                return valueAsString ? (values[0] as any).qcode : values[0];
            }
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

registerEditorField(
    'user',
    EditorFieldUser,
    () => ({
        label: superdeskApi.localization.gettext('User'),
        field: 'user',
    }),
    null,
    true
);

registerEditorField(
    'anpa_category',
    EditorFieldTreeSelect,
    (props) => {
        const vocabulary = superdeskApi.entities.vocabulary.getVocabulary('categories');

        return {
            field: 'anpa_category',
            label: superdeskApi.localization.gettext('ANPA Category'),
            allowMultiple: !(props.singleSelect ?? (vocabulary.selection_type !== 'multi selection')),
            getId: (item: IVocabularyItem) => item.qcode,
            getLabel: (item: IVocabularyItem) => (
                getVocabularyItemNameFromString(
                    item.qcode,
                    vocabulary.items,
                    'qcode',
                    'name',
                    props.language,
                )
            ),
            // Override prepareValueForStorage to simply return the value
            // Otherwise if `allowMultiple==false` then a single category is returned and not a list
            valueAdapter: {prepareValueForStorage: (values) => (values)},
        };
    },
    (state) => ({
        getOptions: () => getCategoriesForTreeSelect(state),
    }),
    false,
);
