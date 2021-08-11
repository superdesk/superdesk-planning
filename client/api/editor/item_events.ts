import {createRef} from 'react';
import moment from 'moment';
import {cloneDeep} from 'lodash';

import {
    BOOKMARK_TYPE,
    EDITOR_TYPE,
    IEditorAPI,
    IEditorBookmark,
    IEditorFormGroup,
    IEventItem,
    IPlanningItem
} from '../../interfaces';
import {planningApi, superdeskApi} from '../../superdeskApi';

import {generateTempId} from '../../utils';
import {getBookmarksFromFormGroups, getEditorFormGroupsFromProfile} from '../../utils/contentProfiles';
import {TEMP_ID_PREFIX} from '../../constants';

import {AddPlanningBookmark, AssociatedPlanningsBookmark} from '../../components/Editor/bookmarks';
import {RelatedPlanningItem} from '../../components/fields/editor/EventRelatedPlannings/RelatedPlanningItem';


export function getEventsInstance(type: EDITOR_TYPE): IEditorAPI['item']['events'] {
    function getGroupsForItem(_item: Partial<IEventItem>): {
        bookmarks: Array<IEditorBookmark>,
        groups: Array<IEditorFormGroup>
    } {
        const {hasPrivilege} = superdeskApi.privileges;
        const profile = planningApi.contentProfiles.get('event');
        const groups = getEditorFormGroupsFromProfile(profile);

        if (!hasPrivilege('planning_planning_management')) {
            delete groups['related_plannings'];
        }

        const canCreatePlanningItems = hasPrivilege('planning_planning_management');
        const bookmarks = getBookmarksFromFormGroups(groups);
        let index = bookmarks.length;

        return {
            bookmarks: bookmarks.concat([{
                id: 'divider-1',
                type: BOOKMARK_TYPE.divider,
                index: index++,
            }, {
                id: 'add_planning',
                type: BOOKMARK_TYPE.custom,
                index: index++,
                disabled: !canCreatePlanningItems,
                component: AddPlanningBookmark,
            }, {
                id: 'associated_plannings',
                type: BOOKMARK_TYPE.custom,
                index: index++,
                disabled: !canCreatePlanningItems,
                component: AssociatedPlanningsBookmark,
            }]),
            groups: Object.values(groups),
        };
    }

    function getRelatedPlanningDomRef(planId: IPlanningItem['_id']): React.RefObject<RelatedPlanningItem> {
        const editor = planningApi.editor(type);
        const field = `planning-item--${planId}`;

        if (editor.dom.fields[field] == null) {
            editor.dom.fields[field] = createRef();
        }

        return editor.dom.fields[field];
    }

    function addPlanningItem() {
        const editor = planningApi.editor(type);
        const event = editor.form.getDiff<IEventItem>();
        const plans = cloneDeep(event.associated_plannings || []);
        const id = generateTempId();

        plans.push({
            _id: id,
            type: 'planning',
            event_item: event._id,
            slugline: event.slugline,
            planning_date: event._sortDate || event.dates?.start,
            internal_note: event.internal_note,
            name: event.name,
            place: event.place,
            subject: event.subject,
            anpa_category: event.anpa_category,
            description_text: event.definition_short,
            ednote: event.ednote,
            agendas: [],
            language: event.language,
        });

        editor.form.changeField('associated_plannings', plans)
            .then(() => {
                const node = getRelatedPlanningDomRef(id);

                if (node.current != null) {
                    node.current.scrollIntoView();
                    editor.form.waitForScroll().then(() => {
                        node.current.focus();
                    });
                }
            });
    }

    function removePlanningItem(item: DeepPartial<IPlanningItem>) {
        if (!item._id.startsWith(TEMP_ID_PREFIX)) {
            // We don't support removing existing Planning items
            return;
        }

        const editor = planningApi.editor(type);
        const event = editor.form.getDiff<IEventItem>();
        const plans = (event.associated_plannings || []).filter(
            (plan) => plan._id !== item._id
        );

        editor.form.changeField('associated_plannings', plans)
            .then(() => {
                const lastPlan = plans[plans.length - 1];

                getRelatedPlanningDomRef(lastPlan?._id).current?.scrollIntoView();
            });
    }

    function updatePlanningItem(
        original: DeepPartial<IPlanningItem>,
        updates: DeepPartial<IPlanningItem>,
        scrollOnChange: boolean
    ) {
        const editor = planningApi.editor(type);
        const event = editor.form.getDiff<IEventItem>();
        const plans = cloneDeep(event.associated_plannings || []);
        const index = plans.findIndex(
            (plan) => plan._id === original._id
        );

        if (index < 0) {
            return;
        }

        plans[index] = {
            ...original,
            ...updates,
        };


        editor.form.changeField('associated_plannings', plans)
            .then(() => {
                if (scrollOnChange) {
                    getRelatedPlanningDomRef(original._id).current?.scrollIntoView();
                }
            });
    }

    function onEventDatesChanged(updates: Partial<IEventItem['dates']>) {
        const editor = planningApi.editor(type);
        const original = editor.form.getDiff<IEventItem>();
        const originalDates = original.dates as Partial<IEventItem['dates']>;

        // If `dates.start` is to be changed, then we may need to update
        // associated Planning item's scheduled dates as well
        if (!moment(originalDates?.start).isSame(moment(updates.start))) {
            const plans = cloneDeep(original.associated_plannings || []);
            let updateAssociatedPlannings = false;

            plans.forEach(
                (plan) => {
                    // If this Planning item was created before the Event has a start date
                    // then the `planning_date` will not be defined. Set it to `dates.start`
                    // and set `planning.scheduled` to `dates.start` for every coverage
                    if (plan.planning_date == null) {
                        updateAssociatedPlannings = true;
                        plan.planning_date = updates.start;
                        (plan.coverages || []).forEach(
                            (coverage) => {
                                coverage.planning.scheduled = plan.planning_date;
                            }
                        );
                    }
                }
            );

            if (updateAssociatedPlannings) {
                editor.form.changeField('associated_plannings', plans);
            }
        }
    }

    return {
        getGroupsForItem,
        getRelatedPlanningDomRef,
        addPlanningItem,
        removePlanningItem,
        updatePlanningItem,
        onEventDatesChanged,
    };
}
