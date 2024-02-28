import React from 'react';
import {connect} from 'react-redux';
import {cloneDeep, isEqual} from 'lodash';

import {IEventItem, IPlanningItem, IEventUpdateMethod, IEmbeddedCoverageItem} from '../../../interfaces';

import {planningApi} from '../../../superdeskApi';
import * as actions from '../../../actions';
import {UpdateMethodSelection} from '../UpdateMethodSelection';
import {EVENTS, TEMP_ID_PREFIX} from '../../../constants';
import {EventScheduleSummary} from '../../Events';
import {eventUtils, gettext} from '../../../utils';
import {onItemActionModalHide, IModalProps} from './utils';
import {storedPlannings} from '../../../selectors/planning';

import {Row} from '../../UI/Preview';
import {Select, Option} from 'superdesk-ui-framework/react';
import {PlanningMetaData} from '../../RelatedPlannings/PlanningMetaData';
import '../style.scss';

interface IOwnProps {
    original: IEventItem;
    updates: Partial<IEventItem>;
    submitting: boolean;
    modalProps: IModalProps;
    enableSaveInModal(): void;
    resolve(item?: IEventItem): void;
}

interface IStateProps {
    originalPlanningItems: {[planningId: string]: IPlanningItem};
}

interface IDispatchProps {
    onSubmit(original: IEventItem, updates: Partial<IEventItem>): void;
    onHide(original: IEventItem): void;
}

type IProps = IOwnProps & IStateProps & IDispatchProps;
type IPlanningEmbeddedCoverageMap = {[planningId: string]: {[coverageId: string]: IEmbeddedCoverageItem}};

interface IRecurringItemUpdateMethodOption {
    name: string;
    value: IEventUpdateMethod;
}

interface IState {
    eventUpdateMethod: IRecurringItemUpdateMethodOption;
    relatedEvents: Array<IEventItem>;
    relatedPlannings: Array<IPlanningItem>;
    posting: boolean;
    diff: Partial<IEventItem>;
    eventModified: boolean;
    recurringPlanningItemsToUpdate: Array<IPlanningItem['_id']>;
    recurringPlanningItemsToCreate: Array<IPlanningItem['_id']>;
    planningUpdateMethods: {[planningId: string]: IEventUpdateMethod};
}

function eventWasUpdated(original: IEventItem, updates: Partial<IEventItem>): boolean {
    const originalItem = eventUtils.modifyForServer(cloneDeep(original));
    const eventUpdates = eventUtils.getEventDiff(originalItem, updates);
    const eventFields = Object.keys(eventUpdates).filter(
        (field) => !['update_method', 'dates'].includes(field)
    );

    return eventFields.length > 0;
}

function getRecurringPlanningToUpdate(
    original: IEventItem,
    updates: Partial<IEventItem>,
    plannings: {[planningId: string]: IPlanningItem}
): Array<IPlanningItem['_id']> {
    const originalCoverages: IPlanningEmbeddedCoverageMap = (original.planning_ids || [])
        .map((planningId) => plannings[planningId])
        .reduce((planningItems, planningItem) => {
            planningItems[planningItem._id] = (planningItem.coverages ?? []).reduce(
                (embeddedCoverages, coverage) => {
                    embeddedCoverages[coverage.coverage_id] = eventUtils.convertCoverageToEventEmbedded(coverage);

                    return embeddedCoverages;
                },
                {}
            );

            return planningItems;
        }, {});

    return (updates.associated_plannings ?? [])
        .filter((planningItem) => {
            if (planningItem._id.startsWith(TEMP_ID_PREFIX)) {
                // This is a temporary Planning, therefor is not part of a recurring series of items
                return false;
            } else if (planningItem.planning_recurrence_id == null) {
                // This Planning item part of a recurring series of items
                return false;
            }

            const embeddedCoverages = (planningItem.coverages ?? []).reduce(
                (embeddedCoverages, coverage) => {
                    embeddedCoverages[coverage.coverage_id] = eventUtils.convertCoverageToEventEmbedded(coverage);

                    return embeddedCoverages;
                },
                {}
            );

            return !isEqual(embeddedCoverages, originalCoverages[planningItem._id]);
        })
        .map((planningItem) => planningItem._id);
}

function getRecurringPlanningToCreate(updates: Partial<IEventItem>): Array<IPlanningItem['_id']> {
    return (updates.associated_plannings ?? [])
        .filter((planningItem) => (planningItem._id.startsWith(TEMP_ID_PREFIX)))
        .map((planningItem) => planningItem._id);
}

export class UpdateRecurringEventsComponent extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        const posting = (this.props.original._post ?? true) === true;
        const isRecurring = this.props.original.recurrence_id != null;
        let relatedEvents: Array<IEventItem> = [];
        let relatedPlannings: Array<IPlanningItem> = [];

        if (isRecurring || eventUtils.eventHasPlanning(this.props.original)) {
            const event = isRecurring ?
                eventUtils.getRelatedEventsForRecurringEvent(
                    this.props.original,
                    EVENTS.UPDATE_METHODS[0],
                    true
                ) :
                this.props.original;

            relatedEvents = event._events;
            relatedPlannings = posting ? [] : event._relatedPlannings;
        }

        this.state = {
            eventUpdateMethod: EVENTS.UPDATE_METHODS[0],
            relatedEvents: relatedEvents,
            relatedPlannings: relatedPlannings,
            posting: posting,
            diff: eventUtils.getEventDiff(this.props.original, this.props.updates),
            eventModified: eventWasUpdated(this.props.original, this.props.updates),
            recurringPlanningItemsToUpdate: getRecurringPlanningToUpdate(
                this.props.original,
                this.props.updates,
                this.props.originalPlanningItems
            ),
            recurringPlanningItemsToCreate: getRecurringPlanningToCreate(this.props.updates),
            planningUpdateMethods: {},
        };

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
    }

    componentDidMount() {
        // Enable save so that the user can update just this event.
        this.props.enableSaveInModal();
    }

    onEventUpdateMethodChange(field, option) {
        const event = eventUtils.getRelatedEventsForRecurringEvent(
            this.props.original,
            option,
            true
        );

        this.setState({
            eventUpdateMethod: option,
            relatedEvents: event._events,
            relatedPlannings: this.state.posting ? [] : event._relatedPlannings,
        });
    }

    submit() {
        const updates = {
            ...this.props.updates,
            update_method: this.state.eventUpdateMethod.value,
        };

        updates.associated_plannings.forEach((planningItem) => {
            if (this.state.planningUpdateMethods[planningItem._id] != null) {
                planningItem.update_method = this.state.planningUpdateMethods[planningItem._id];
            }
        });

        return this.props.onSubmit(this.props.original, updates);
    }

    renderPlanningCreateForm() {
        if (this.state.recurringPlanningItemsToCreate.length > 0) {
            return this.props.updates.associated_plannings
                .filter((planningItem) => (
                    this.state.recurringPlanningItemsToCreate.includes(planningItem._id)
                ))
                .map((planningItem) => (
                    <div key={planningItem._id}>
                        <Select
                            label={gettext('Create planning for all events or just this one?')}
                            value={this.state.planningUpdateMethods[planningItem._id] ?? EVENTS.UPDATE_METHODS[0].value}
                            onChange={(updateMethod) => {
                                this.onPlanningUpdateMethodChange(planningItem._id, updateMethod as IEventUpdateMethod);
                            }}
                        >
                            <Option value={EVENTS.UPDATE_METHODS[0].value}>
                                {gettext('This event only')}
                            </Option>
                            <Option value={EVENTS.UPDATE_METHODS[1].value}>
                                {gettext('This and all future events')}
                            </Option>
                            <Option value={EVENTS.UPDATE_METHODS[2].value}>
                                {gettext('All Events')}
                            </Option>
                        </Select>
                        <PlanningMetaData plan={planningItem} />
                    </div>
                ));
        }

        return null;
    }

    renderPlanningUpdateForm() {
        if (this.state.recurringPlanningItemsToUpdate.length > 0) {
            return this.props.updates.associated_plannings
                .filter((planningItem) => (
                    this.state.recurringPlanningItemsToUpdate.includes(planningItem._id)
                ))
                .map((planningItem) => (
                    <div key={planningItem._id}>
                        <Select
                            label={gettext('Update all recurring planning or just this one?')}
                            value={this.state.planningUpdateMethods[planningItem._id] ?? EVENTS.UPDATE_METHODS[0].value}
                            onChange={(updateMethod) => {
                                this.onPlanningUpdateMethodChange(planningItem._id, updateMethod as IEventUpdateMethod);
                            }}
                        >
                            <Option value={EVENTS.UPDATE_METHODS[0].value}>
                                {gettext('This planning only')}
                            </Option>
                            <Option value={EVENTS.UPDATE_METHODS[1].value}>
                                {gettext('This and all future planning')}
                            </Option>
                            <Option value={EVENTS.UPDATE_METHODS[2].value}>
                                {gettext('All planning')}
                            </Option>
                        </Select>
                        <PlanningMetaData plan={planningItem} />
                    </div>
                ));
        }

        return null;
    }

    onPlanningUpdateMethodChange(planningId: string, updateMethod: IEventUpdateMethod) {
        this.setState((prevState) => ({
            planningUpdateMethods: {
                ...prevState.planningUpdateMethods,
                [planningId]: updateMethod,
            },
        }));
    }

    render() {
        const {original, submitting} = this.props;
        const isRecurring = !!original.recurrence_id;
        const eventsInUse = this.state.relatedEvents.filter((e) => (
            (e.planning_ids?.length ?? 0) > 0 || e.pubstatus != null
        ));
        const numEvents = this.state.relatedEvents.length + 1 - eventsInUse.length;

        return (
            <React.Fragment>
                {this.state.eventModified === false ? null : (
                    <div className="MetadataView">
                        <Row
                            enabled={!!original.slugline}
                            label={gettext('Slugline')}
                            value={original.slugline || ''}
                            noPadding={true}
                            className="slugline"
                        />

                        <Row
                            label={gettext('Name')}
                            value={original.name || ''}
                            noPadding={true}
                            className="strong"
                        />

                        <EventScheduleSummary
                            event={original}
                            forUpdating={true}
                            useEventTimezone={true}
                        />

                        <Row
                            enabled={isRecurring}
                            label={gettext('No. of Events')}
                            value={numEvents}
                            noPadding={true}
                        />

                        <UpdateMethodSelection
                            value={this.state.eventUpdateMethod}
                            onChange={this.onEventUpdateMethodChange}
                            showMethodSelection={isRecurring}
                            updateMethodLabel={gettext('Update all recurring events or just this one?')}
                            showSpace={false}
                            readOnly={submitting}
                            action="unpost"
                            relatedPlannings={this.state.relatedPlannings}
                        />
                    </div>
                )}
                {this.renderPlanningCreateForm()}
                {this.renderPlanningUpdateForm()}
            </React.Fragment>
        );
    }
}

const mapStateToProps = (state) => ({
    originalPlanningItems: storedPlannings(state),
});

const mapDispatchToProps = (dispatch: any, ownProps: IOwnProps) => ({
    onSubmit: (original, updates) => (
        dispatch(actions.main.save(original, updates, false))
            .then((savedItem) => {
                if (ownProps.modalProps.unlockOnClose) {
                    planningApi.locks.unlockItem(savedItem);
                }

                if (ownProps.resolve) {
                    ownProps.resolve(savedItem);
                }
            })
    ),
    onHide: (original) => (
        onItemActionModalHide(original, ownProps?.modalProps?.unlockOnClose, ownProps?.modalProps).then(() => {
            if (ownProps?.resolve != null) {
                ownProps.resolve();
            }
        })
    ),
});

export const UpdateRecurringEventsForm = connect<IStateProps, IDispatchProps>(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {forwardRef: true}
)(UpdateRecurringEventsComponent);
