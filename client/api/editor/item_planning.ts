import {createRef, RefObject} from 'react';
import {cloneDeep} from 'lodash';

import {
    BOOKMARK_TYPE,
    EDITOR_TYPE,
    ICoverageContentProfile,
    ICoverageType,
    IEditorAPI,
    IEditorBookmark,
    IEditorFormGroup,
    IPlanningCoverageItem,
    IPlanningItem,
    ISearchProfile,
} from '../../interfaces';
import {planningApi} from '../../superdeskApi';

import {
    getBookmarksFromFormGroups,
    getEditorFormGroupsFromProfile,
    getGroupFieldsSorted,
} from '../../utils/contentProfiles';

import {CoveragesBookmark, AddCoverageBookmark} from '../../components/Editor/bookmarks';
import {AssociatedEventItem} from '../../components/fields/editor/AssociatedEventItem';
import {coverageProfiles} from '../../selectors/coverageProfiles';

const covDefaultProfile = {
    _id: 'coverage',
    name: 'coverage',
    init_version: 1,
    schema: {
        add_coverage_to_workflow: {
            type: 'boolean',
            required: false
        },
        contact_info: {
            type: 'string',
            required: false
        },
        ednote: {
            type: 'string',
            required: false,
            field_type: 'multi_line'
        },
        files: {
            type: 'list',
            required: false,
            mandatory_in_list: null,
            schema: null
        },
        g2_content_type: {
            type: 'list',
            required: true,
            mandatory_in_list: null,
            schema: null
        },
        genre: {
            type: 'list',
            required: false,
            mandatory_in_list: null,
            schema: null
        },
        headline: {
            type: 'string',
            required: false
        },
        internal_note: {
            type: 'string',
            required: false,
            field_type: 'multi_line',
            expandable: true
        },
        keyword: {
            type: 'list',
            required: false,
            mandatory_in_list: null,
            schema: null
        },
        language: {
            type: 'string',
            required: true
        },
        news_coverage_status: {
            type: 'list',
            required: false,
            mandatory_in_list: null,
            schema: null
        },
        priority: {
            type: 'integer',
            required: false
        },
        scheduled: {
            type: 'datetime',
            required: true
        },
        scheduled_updates: {
            type: 'list',
            required: false,
            mandatory_in_list: null,
            schema: null
        },
        slugline: {
            type: 'string',
            required: false
        },
        xmp_file: {
            type: 'dict',
            required: false
        }
    },
    editor: {
        add_coverage_to_workflow: {
            enabled: true,
            index: 1
        },
        g2_content_type: {
            enabled: true,
            index: 2
        },
        genre: {
            enabled: true,
            index: 3
        },
        slugline: {
            enabled: true,
            index: 4
        },
        ednote: {
            enabled: true,
            index: 5
        },
        internal_note: {
            enabled: true,
            index: 6
        },
        news_coverage_status: {
            enabled: true,
            index: 7
        },
        scheduled: {
            enabled: true,
            index: 8
        },
        scheduled_updates: {
            enabled: true,
            index: 9
        },
        contact_info: {
            enabled: false
        },
        language: {
            enabled: true
        },
        xmp_file: {
            enabled: false
        },
        headline: {
            enabled: false
        },
        keyword: {
            enabled: false
        },
        files: {
            enabled: false
        },
        priority: {
            enabled: false
        }
    },
    _etag: 'init',
    _created: '2025-02-20T05:54:27+0000',
    _updated: '2025-02-20T05:54:27+0000',
    groups: {},
    _links: {
        self: {
            title: 'Planning_type',
            href: 'planning_types/coverage'
        }
    }
};

export function getCoverageFields(
    type: ICoverageType,
): {searchProfile: ISearchProfile; profile: ICoverageContentProfile} {
    const allProfiles = coverageProfiles(planningApi.redux.store.getState());
    // TODO: fallback to default profile
    const profile = allProfiles.find((x) => x.content_type === type)
        ?? covDefaultProfile;
    const fields = getGroupFieldsSorted(profile).filter((item) => item.field.enabled);
    const searchProfile: ISearchProfile = {};

    fields.forEach(
        (field, index) => {
            searchProfile[field.name] = {
                enabled: true,
                index: index,
            };
        },
    );

    return {searchProfile, profile};
}

export function getPlanningInstance(type: EDITOR_TYPE): IEditorAPI['item']['planning'] {
    function getGroupsForItem(item: Partial<IPlanningItem>): {
        bookmarks: Array<IEditorBookmark>,
        groups: Array<IEditorFormGroup>
    } {
        const profile = planningApi.contentProfiles.get('planning');
        const groups = getEditorFormGroupsFromProfile(profile);

        const bookmarks = getBookmarksFromFormGroups(groups);
        let index = bookmarks.length;

        return {
            bookmarks: bookmarks.concat([{
                id: 'divider-1',
                type: BOOKMARK_TYPE.divider,
                index: index++,
            }, {
                id: 'add_coverage',
                type: BOOKMARK_TYPE.custom,
                index: index++,
                component: AddCoverageBookmark,
            }, {
                id: 'coverage_links',
                type: BOOKMARK_TYPE.custom,
                index: index++,
                component: CoveragesBookmark,
            }]),
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

    function getRelatedEventsDomRef(eventId: IEventItem['_id']): RefObject<AssociatedEventItem> {
        const editor = planningApi.editor(type);
        const field = `planning-item--${eventId}`;

        if (editor.dom.fields[field] == null) {
            editor.dom.fields[field] = createRef();
        }

        return editor.dom.fields[field];
    }

    function removeEventItem(item: DeepPartial<IEventItem>): void {
        const editor = planningApi.editor(type);
        const planning = editor.form.getDiff<IPlanningItem>();
        const events = (planning.related_events || []).filter(
            (event) => event._id !== item._id
        );

        editor.form.changeField('related_events', events)
            .then(() => {
                const lastEvent = events[events.length - 1];

                getRelatedEventsDomRef(lastEvent?._id).current?.toggleBoxRef.current.scrollIntoView();
            });
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
                if (newCoverage.workflow_status === 'spiked') {
                    // This coverage is marked for deletion
                    // Remove it from the coverages array at `index`
                    updatedCoverages.splice(index, 1);
                } else {
                    // Update the coverage at `index`
                    updatedCoverages[index] = newCoverage;
                }
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
        getCoverageFields,
        getRelatedEventsDomRef,
        removeEventItem,
        getCoverageFieldDomRef,
        addCoverages,
    };
}
