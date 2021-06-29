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
import {filterProfileForEnabledFields} from '../../utils/forms';
import {TEMP_ID_PREFIX} from '../../constants';

import {AddPlanningBookmark, AssociatedPlanningsBookmark} from '../../components/Editor/bookmarks';
import {RelatedPlanningItem} from '../../components/fields/editor/EventRelatedPlannings/RelatedPlanningItem';


export function getEventsInstance(type: EDITOR_TYPE): IEditorAPI['item']['events'] {
    function getGroups() {
        const {gettext} = superdeskApi.localization;
        const profile = planningApi.events.getEditorProfile();

        return {
            schedule: {
                id: 'schedule',
                index: 0,
                fields: filterProfileForEnabledFields(profile, [
                    'dates.recurring_rules',
                    'dates',
                ]),
            },
            description: {
                id: 'description',
                index: 1,
                fields: filterProfileForEnabledFields(profile, [
                    'language',
                    'slugline',
                    'name',
                    'definition_short',
                    'reference',
                    'calendars',
                    'place',
                    'occur_status',
                ]),
            },
            location: {
                id: 'location',
                index: 2,
                fields: filterProfileForEnabledFields(profile, [
                    'location',
                    'event_contact_info',
                ]),
            },
            details: {
                id: 'details',
                index: 3,
                useToggleBox: true,
                title: gettext('Details'),
                fields: filterProfileForEnabledFields(profile, [
                    'anpa_category',
                    'subject',
                    'custom_vocabularies',
                    'definition_long',
                    'internal_note',
                    'ednote',
                ]),
            },
            attachments: {
                id: 'attachments',
                index: 4,
                fields: filterProfileForEnabledFields(profile, [
                    'files',
                ]),
            },
            links: {
                id: 'links',
                index: 5,
                fields: filterProfileForEnabledFields(profile, [
                    'links',
                ]),
            },
            'add-planning': {
                id: 'add-planning',
                index: 6,
                fields: filterProfileForEnabledFields(profile, [
                    'related_plannings',
                ]),
            },
        };
    }

    function getGroupsForItem(item: Partial<IEventItem>): {
        bookmarks: Array<IEditorBookmark>,
        groups: Array<IEditorFormGroup>
    } {
        const {gettext} = superdeskApi.localization;
        const groups = getGroups();

        return {
            bookmarks: [{
                id: 'schedule',
                group_id: 'schedule',
                type: BOOKMARK_TYPE.formGroup,
                icon: 'time',
                index: 0,
                name: gettext('Schedule'),
                tooltip: gettext('Schedule'),
                disabled: !groups.schedule.fields.length,
            }, {
                id: 'description',
                group_id: 'description',
                type: BOOKMARK_TYPE.formGroup,
                icon: 'align-left',
                index: 1,
                name: gettext('Description'),
                tooltip: gettext('Description'),
                disabled: !groups.description.fields.length,
            }, {
                id: 'location',
                group_id: 'location',
                type: BOOKMARK_TYPE.formGroup,
                icon: 'map-marker',
                index: 2,
                name: gettext('Location'),
                tooltip: gettext('Location'),
                disabled: !groups.location.fields.length,
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
                name: gettext('Attachments'),
                tooltip: gettext('Attachments'),
                disabled: !groups.attachments.fields.length,
            }, {
                id: 'links',
                group_id: 'links',
                type: BOOKMARK_TYPE.formGroup,
                icon: 'link',
                index: 5,
                name: gettext('Links'),
                tooltip: gettext('Links'),
                disabled: !groups.links.fields.length,
            }, {
                id: 'divider-1',
                type: BOOKMARK_TYPE.divider,
                index: 6,
            }, {
                id: 'add_planning',
                type: BOOKMARK_TYPE.custom,
                index: 7,
                component: AddPlanningBookmark,
            }, {
                id: 'associated_plannings',
                type: BOOKMARK_TYPE.custom,
                index: 8,
                component: AssociatedPlanningsBookmark,
            }],
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
