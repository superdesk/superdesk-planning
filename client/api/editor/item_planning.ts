import {createRef} from 'react';
import {cloneDeep} from 'lodash';

import {
    BOOKMARK_TYPE,
    EDITOR_TYPE,
    IEditorAPI,
    IEditorBookmark,
    IEditorFormGroup,
    IPlanningCoverageItem,
    IPlanningItem
} from '../../interfaces';
import {planningApi, superdeskApi} from '../../superdeskApi';

import {filterProfileForEnabledFields} from '../../utils/forms';

import {CoveragesBookmark, AddCoverageBookmark} from '../../components/Editor/bookmarks';

export function getPlanningInstance(type: EDITOR_TYPE): IEditorAPI['item']['planning'] {
    function getGroups(item: DeepPartial<IPlanningItem>) {
        const {gettext} = superdeskApi.localization;
        const profile = planningApi.planning.getEditorProfile();

        return {
            title: {
                id: 'title',
                index: 0,
                fields: filterProfileForEnabledFields(profile, [
                    'language',
                    'slugline',
                    'headline',
                    'name',
                ]),
            },
            schedule: {
                id: 'schedule',
                index: 1,
                fields: filterProfileForEnabledFields(profile, [
                    'planning_date',
                ]),
            },
            description: {
                id: 'description',
                index: 2,
                fields: filterProfileForEnabledFields(profile, [
                    'description_text',
                    'internal_note',
                    'place',
                    'agendas',
                ]),
            },
            details: {
                id: 'details',
                index: 3,
                useToggleBox: true,
                title: gettext('Details'),
                fields: filterProfileForEnabledFields(profile, [
                    'ednote',
                    'anpa_category',
                    'subject',
                    'custom_vocabularies',
                    'urgency',
                    'flags.marked_for_not_publication',
                    'flags.overide_auto_assign_to_workflow',
                ]),
            },
            attachments: {
                id: 'attachments',
                index: 4,
                fields: filterProfileForEnabledFields(profile, [
                    'files',
                ]),
            },
            associated_event: {
                id: 'associated_event',
                index: 5,
                fields: filterProfileForEnabledFields(profile, [
                    'associated_event',
                ]),
                disabled: item.event_item == null,
            },
            coverages: {
                id: 'coverages',
                index: 6,
                fields: filterProfileForEnabledFields(profile, [
                    'coverages',
                ]),
            },
        };
    }

    function getGroupsForItem(item: DeepPartial<IPlanningItem>): {
        bookmarks: Array<IEditorBookmark>,
        groups: Array<IEditorFormGroup>
    } {
        const {gettext} = superdeskApi.localization;
        const groups = getGroups(item);

        return {
            bookmarks: [{
                id: 'title',
                group_id: 'title',
                type: BOOKMARK_TYPE.formGroup,
                icon: 'align-left',
                index: 0,
                name: gettext('Title'),
                tooltip: gettext('Title'),
                disabled: !groups.title.fields.length,
            }, {
                id: 'schedule',
                group_id: 'schedule',
                type: BOOKMARK_TYPE.formGroup,
                icon: 'time',
                index: 1,
                name: gettext('Schedule'),
                tooltip: gettext('Schedule'),
                disabled: !groups.schedule.fields.length,
            }, {
                id: 'description',
                group_id: 'description',
                type: BOOKMARK_TYPE.formGroup,
                icon: 'align-left',
                index: 2,
                name: gettext('Description'),
                tooltip: gettext('Description'),
                disabled: !groups.description.fields.length,
            }, {
                id: 'details',
                group_id: 'details',
                type: BOOKMARK_TYPE.formGroup,
                icon: 'info-sign',
                index: 3,
                name: gettext('Details'),
                tooltip: gettext('Details'),
                disabled: !groups.details.fields.length,
            }, {
                id: 'attachments',
                group_id: 'attachments',
                type: BOOKMARK_TYPE.formGroup,
                icon: 'attachment',
                index: 4,
                name: gettext('Attached Files'),
                tooltip: gettext('Attached Files'),
                disabled: !groups.attachments.fields.length,
            }, {
                id: 'associated_event',
                group_id: 'associated_event',
                type: BOOKMARK_TYPE.formGroup,
                icon: 'calendar',
                index: 5,
                name: gettext('Associated Event'),
                tooltip: gettext('Associated Event'),
                disabled: item.event_item == null || !groups.associated_event.fields.length,
            }, {
                id: 'divider-1',
                type: BOOKMARK_TYPE.divider,
                index: 6,
            }, {
                id: 'add_coverage',
                type: BOOKMARK_TYPE.custom,
                index: 7,
                component: AddCoverageBookmark,
            }, {
                id: 'coverage_links',
                type: BOOKMARK_TYPE.custom,
                index: 8,
                component: CoveragesBookmark,
            }],
            groups: Object.values(groups),
        };
    }

    function getCoverageFieldDomRef(coverageId: IPlanningCoverageItem['coverage_id']) {
        const editor = planningApi.editor(type);
        const field = `coverage_${coverageId}`;

        if (editor.dom.fields[field] == null) {
            editor.dom.fields[field] = createRef();
        }

        return editor.dom.fields[field];
    }

    function addCoverages(coverages: Array<DeepPartial<IPlanningCoverageItem>>) {
        const editor = planningApi.editor(type);
        const diff = editor.manager.getState().diff as DeepPartial<IPlanningItem>;
        const updatedCoverages: DeepPartial<IPlanningItem['coverages']> = cloneDeep(diff.coverages);

        coverages.forEach((newCoverage) => {
            const index = updatedCoverages.findIndex(
                (coverage) => coverage.coverage_id === newCoverage.coverage_id
            );

            if (index >= 0) {
                // This coverage is an existing coverage
                // so update the coverage at `index`
                updatedCoverages[index] = newCoverage;
            } else {
                // This is a new coverage
                // so append to the array
                updatedCoverages.push(newCoverage);
            }
        });

        editor.form.changeField('coverages', updatedCoverages);
        editor.autosave.flushAutosave();
    }

    return {
        getGroupsForItem,
        getCoverageFieldDomRef,
        addCoverages,
    };
}
