import {createRef, RefObject} from 'react';
import {cloneDeep, omit} from 'lodash';

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
import {coverageProfiles, oldProfile} from '../../selectors/coverageProfiles';

export function getCoverageFields(
    type: ICoverageType,
): {searchProfile: ISearchProfile; profile: ICoverageContentProfile} {
    const storeState = planningApi.redux.store.getState();
    const allProfiles = coverageProfiles(storeState);
    const newProfile = allProfiles.find((x) => x.content_type === type);
    const profile = newProfile ? newProfile : omit(oldProfile(storeState), '_id') as ICoverageContentProfile;
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
