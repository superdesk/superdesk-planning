import {createRef} from 'react';
import {cloneDeep} from 'lodash';

import {
    BOOKMARK_TYPE,
    EDITOR_TYPE,
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
import {getRelatedEventLinksForPlanning} from '../../utils/planning';

import {CoveragesBookmark, AddCoverageBookmark} from '../../components/Editor/bookmarks';

export function getPlanningInstance(type: EDITOR_TYPE): IEditorAPI['item']['planning'] {
    function getCoverageFields(): ISearchProfile {
        const fields = getGroupFieldsSorted(planningApi.contentProfiles.get('coverage'))
            .filter((item) => item.field.enabled);
        const profile: ISearchProfile = {};

        fields.forEach(
            (field, index) => {
                profile[field.name] = {
                    enabled: true,
                    index: index,
                };
            },
        );

        return profile;
    }

    function getGroupsForItem(item: Partial<IPlanningItem>): {
        bookmarks: Array<IEditorBookmark>,
        groups: Array<IEditorFormGroup>
    } {
        const profile = planningApi.contentProfiles.get('planning');
        const groups = getEditorFormGroupsFromProfile(profile);

        if (getRelatedEventLinksForPlanning(item).length === 0) {
            delete groups['associated_event'];
        }
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
        getCoverageFieldDomRef,
        addCoverages,
    };
}
