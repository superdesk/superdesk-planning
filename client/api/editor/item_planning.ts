import {createRef, RefObject} from 'react';
import {cloneDeep, omit} from 'lodash';

import {
    BOOKMARK_TYPE,
    EDITOR_TYPE,
    IPlanningContentProfile,
    ICoverageType,
    IEditorAPI,
    IEditorBookmark,
    IEditorFormGroup,
    IEventItem,
    IPlanningCoverageItem,
    IPlanningItem,
    IPlanningRelatedEventLink,
    ISearchProfile,
} from '../../interfaces';
import {planningApi, superdeskApi} from '../../superdeskApi';

import {
    getBookmarksFromFormGroups,
    getEditorFormGroupsFromProfile,
    getGroupFieldsSorted,
} from '../../utils/contentProfiles';

import {CoveragesBookmark, AddCoverageBookmark} from '../../components/Editor/bookmarks';
import {AssociatedEventItem} from '../../components/fields/editor/AssociatedEventItem';
import {coverageProfiles, oldProfile} from '../../selectors/coverageProfiles';
import {isTemporaryId} from '../../utils';
import {appConfig} from 'superdesk-core/scripts/appConfig';

export function getCoverageFields(
    type: ICoverageType,
): {searchProfile: ISearchProfile; profile: IPlanningContentProfile} {
    const storeState = planningApi.redux.store.getState();
    const allProfiles = coverageProfiles(storeState);
    const newProfile = allProfiles.find((x) => x.content_type === type);
    const profile = newProfile ? newProfile : omit(oldProfile(storeState), '_id') as IPlanningContentProfile;
    const autoAddToWorkflow = appConfig.planning_auto_assign_to_workflow;

    const fields = getGroupFieldsSorted(profile).filter((item) =>
        item.field.enabled
            && autoAddToWorkflow ? item.name != 'add_coverage_to_workflow' : true
    );
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

    function updateEventItem(
        original: DeepPartial<IPlanningRelatedEventLink>,
        updates: DeepPartial<IEventItem>,
        scrollOnChange: boolean
    ) {
        const editor = planningApi.editor(type);
        const planning = editor.form.getDiff<IPlanningItem>();
        const events = cloneDeep(planning.related_events || []);
        const tempEvents = planning._unsaved_related_events ?? [];
        const index = events.findIndex(
            (event) => event._id === original._id
        );
        const isEmpty = events.length < 1;

        if (!isEmpty && index < 0) {
            if (tempEvents.find((x) => x._id === original._id) != null) {
                events.push({
                    _id: updates._id,
                    link_type: original.link_type,
                    recurrence_id: original.recurrence_id,
                });
            } else {
                // This should never happen, but make sure to notify the user in some corruption case
                superdeskApi.ui.notify.error(
                    superdeskApi.localization.gettext(
                        'Could not link event - Please close the item and try linking again'
                    ),
                );

                return;
            }
        } else {
            events[isEmpty ? 0 : index] = {
                _id: updates._id,
                link_type: original.link_type,
                recurrence_id: original.recurrence_id
            };
        }

        const updateMainField = () => {
            return editor.form.changeField('related_events', events, true, true)
                .then(() => {
                    if (scrollOnChange) {
                        getRelatedEventsDomRef(original._id).current?.scrollIntoView();
                    }
                });
        };

        // On saving of a temporary event from the embedded form itself,
        // we must also remove it from _unsaved_related_events
        // otherwise trying to save the same item twice would happen
        if (isTemporaryId(original._id) && !isTemporaryId(updates._id)) {
            return editor.form.changeField(
                superdeskApi.helpers.nameof<IPlanningItem>('_unsaved_related_events'),
                planning._unsaved_related_events.filter((x) => x._id != original._id),
                true,
                true
            ).then(updateMainField);
        } else {
            return updateMainField();
        }
    }

    function getRelatedEventsDomRef(eventId: IEventItem['_id']): RefObject<AssociatedEventItem> {
        const editor = planningApi.editor(type);
        const field = `planning-item--${eventId}`;

        if (editor.dom.fields[field] == null) {
            editor.dom.fields[field] = createRef();
        }

        return editor.dom.fields[field];
    }

    function unlinkEvent(item: DeepPartial<IEventItem>): void {
        const editor = planningApi.editor(type);
        const planning = editor.form.getDiff<IPlanningItem>();
        const events = (planning.related_events || []).filter(
            (event) => event._id !== item._id
        );

        const unsavedEvents = (planning._unsaved_related_events || []).filter(
            (event) => event._id !== item._id
        );

        editor.form.changeField('_unsaved_related_events', unsavedEvents);

        editor.form.changeField('related_events', events)
            .then(() => {
                const lastEvent = events[events.length - 1];

                getRelatedEventsDomRef(lastEvent?._id)?.current?.scrollIntoView();
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
        unlinkEvent,
        getCoverageFieldDomRef,
        addCoverages,
        updateEventItem,
    };
}
