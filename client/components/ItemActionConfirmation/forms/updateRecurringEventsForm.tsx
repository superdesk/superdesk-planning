import React from 'react';
import {connect} from 'react-redux';
import {cloneDeep, isEqual} from 'lodash';

import {
    IEmbeddedCoverageItem,
    IEventFormProfile,
    IEventItem,
    IEventUpdateMethod,
    IPlanningItem,
    PREVIEW_PANEL,
} from '../../../interfaces';

import {planningApi} from '../../../superdeskApi';
import * as actions from '../../../actions';
import {EVENTS, TEMP_ID_PREFIX} from '../../../constants';
import {eventUtils, gettext} from '../../../utils';
import {IModalProps, onItemActionModalHide} from './utils';
import {storedPlannings} from '../../../selectors/planning';
import {eventProfile} from '../../../selectors/forms';

import {ContentDivider, Heading, Option, Select, Text, FormLabel} from 'superdesk-ui-framework/react';
import {PlanningMetaData} from '../../RelatedPlannings/PlanningMetaData';
import {previewGroupToProfile, renderGroupedFieldsForPanel} from '../../fields';
import {getUserInterfaceLanguageFromCV} from '../../../utils/users';
import '../style.scss';

interface IOwnProps {
    original: IEventItem;
    updates: Partial<IEventItem>;
    modalProps: IModalProps;
    enableSaveInModal?(): void;
    resolve?(item?: IEventItem): void;
    onEventUpdateMethodChange?(option: IEventUpdateMethod): void;
    onPlanningUpdateMethodChange?(planningId: IPlanningItem['_id'], updateMethod: IEventUpdateMethod): void;
}

interface IStateProps {
    originalPlanningItems: {[planningId: string]: IPlanningItem};
    eventProfile: IEventFormProfile;
}

interface IDispatchProps {
    onSubmit(original: IEventItem, updates: Partial<IEventItem>): void;
    onHide(original: IEventItem): void;
}

type IProps = IOwnProps & IStateProps & IDispatchProps;
type IPlanningEmbeddedCoverageMap = {[planningId: string]: {[coverageId: string]: IEmbeddedCoverageItem}};

interface IState {
    eventUpdateMethod: IEventUpdateMethod;
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
        (field) => !['update_method', 'dates', 'associated_plannings'].includes(field)
    );

    return eventFields.length > 0;
}

function getRecurringPlanningToUpdate(
    original: IEventItem,
    updates: Partial<IEventItem>,
    plannings: {[planningId: string]: IPlanningItem}
): Array<IPlanningItem['_id']> {
    const originalCoverages: IPlanningEmbeddedCoverageMap = (original.planning_ids ?? [])
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

            relatedEvents = event._events || [];
            relatedPlannings = posting ? [] : event._relatedPlannings;
        }

        this.state = {
            eventUpdateMethod: EVENTS.UPDATE_METHODS[0].value,
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
        if (this.props.enableSaveInModal != null) {
            // Enable save so that the user can update just this event.
            this.props.enableSaveInModal();
        }
    }

    onEventUpdateMethodChange(updateMethod: IEventUpdateMethod) {
        const event = eventUtils.getRelatedEventsForRecurringEvent(
            this.props.original,
            {value: updateMethod, name: updateMethod},
            true
        );

        this.setState({
            eventUpdateMethod: updateMethod,
            relatedEvents: event._events || [],
            relatedPlannings: this.state.posting ? [] : event._relatedPlannings,
        });
        if (this.props.onEventUpdateMethodChange != null) {
            this.props.onEventUpdateMethodChange(updateMethod);
        }
    }

    submit() {
        const updates = {
            ...this.props.updates,
            update_method: this.state.eventUpdateMethod,
        };

        updates.associated_plannings.forEach((planningItem) => {
            if (this.state.planningUpdateMethods[planningItem._id] != null) {
                planningItem.update_method = this.state.planningUpdateMethods[planningItem._id];
            }
        });

        return this.props.onSubmit(this.props.original, updates);
    }

    renderModifiedPlanningItems() {
        const planningsToCreate = (this.props.updates.associated_plannings || [])
            .filter((planningItem) => (
                this.state.recurringPlanningItemsToCreate.includes(planningItem._id)
            ));
        const planningsToUpdate = (this.props.updates.associated_plannings || [])
            .filter((planningItem) => (
                this.state.recurringPlanningItemsToUpdate.includes(planningItem._id)
            ));

        if (planningsToCreate.length === 0 && planningsToUpdate.length === 0) {
            return null;
        }

        return (
            <React.Fragment>
                <Heading type="h3" className="mb-1 sd-text--strong">
                    {gettext('Related Planning(s)')}
                </Heading>
                {planningsToCreate.map((item, index) => (
                    this.renderPlanningItem(item, false, index === planningsToCreate.length - 1)
                ))}
                {planningsToCreate.length === 0 || planningsToUpdate.length === 0 ? null : (
                    <ContentDivider type="dashed" margin="small" />
                )}
                {planningsToUpdate.map((item, index) => (
                    this.renderPlanningItem(item, true, index === planningsToUpdate.length - 1)
                ))}
            </React.Fragment>
        );
    }

    renderPlanningItem(item: Partial<IPlanningItem>, planningExists: boolean, lastItem: boolean) {
        return (
            <React.Fragment>
                <Text size="small" className="mb-1">
                    {planningExists === true ? (
                        <React.Fragment>
                            <strong>
                                {gettext('You made changes to this planning item that is part of a recurring event.')}
                            </strong>
                            &nbsp;{gettext('Apply the changes to all recurring planning items or just this one?')}
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            <strong>
                                {gettext('You are creating a new planning item.')}
                            </strong>
                            &nbsp;{gettext('Add this item to all recurring events or just this one?')}
                        </React.Fragment>
                    )}
                </Text>
                <PlanningMetaData plan={item} />
                <Select
                    label={planningExists === true ?
                        gettext('Update all recurring planning or just this one?') :
                        gettext('Create planning for all events or just this one?')
                    }
                    labelHidden={true}
                    inlineLabel={true}
                    value={this.state.planningUpdateMethods[item._id] ?? EVENTS.UPDATE_METHODS[0].value}
                    onChange={(updateMethod) => {
                        this.onPlanningUpdateMethodChange(item._id, updateMethod as IEventUpdateMethod);
                    }}
                >
                    <Option value={EVENTS.UPDATE_METHODS[0].value}>
                        {planningExists === true ?
                            gettext('This planning only') :
                            gettext('This event only')
                        }
                    </Option>
                    <Option value={EVENTS.UPDATE_METHODS[1].value}>
                        {planningExists === true ?
                            gettext('This and all future planning') :
                            gettext('This and all future events')
                        }
                    </Option>
                    <Option value={EVENTS.UPDATE_METHODS[2].value}>
                        {planningExists === true ?
                            gettext('All planning') :
                            gettext('All Events')
                        }
                    </Option>
                </Select>
                {lastItem === true ? null : (
                    <ContentDivider type="dashed" margin="small" />
                )}
            </React.Fragment>
        );
    }

    onPlanningUpdateMethodChange(planningId: IPlanningItem['_id'], updateMethod: IEventUpdateMethod) {
        this.setState((prevState) => ({
            planningUpdateMethods: {
                ...prevState.planningUpdateMethods,
                [planningId]: updateMethod,
            },
        }));
        if (this.props.onPlanningUpdateMethodChange != null) {
            this.props.onPlanningUpdateMethodChange(planningId, updateMethod);
        }
    }

    render() {
        const {original} = this.props;
        const isRecurring = !!original.recurrence_id;
        const eventsInUse = this.state.relatedEvents.filter((e) => (
            (e.planning_ids?.length ?? 0) > 0 || e.pubstatus != null
        ));
        const numEvents = this.state.relatedEvents.length + 1 - eventsInUse.length;

        return (
            <React.Fragment>
                <ul className="simple-list simple-list--dotted pb--0">
                    {renderGroupedFieldsForPanel(
                        'simple-preview',
                        previewGroupToProfile(PREVIEW_PANEL.EVENT, this.props.eventProfile, false),
                        {
                            item: {
                                ...this.props.original,
                                ...this.props.updates,
                            },
                            language: this.props.updates.language ??
                                this.props.original.language ??
                                getUserInterfaceLanguageFromCV(),
                            useFormLabelAndText: true,
                            schema: this.props.eventProfile.schema,
                            profile: this.props.eventProfile,
                            addContentDivider: true,
                        },
                        {},
                    )}
                    {this.state.eventModified === false || isRecurring !== true ? null : (
                        <React.Fragment>
                            <div>
                                <FormLabel text={gettext('No. of Events')} />
                                <Text size="small" weight="medium">
                                    {numEvents}
                                </Text>
                            </div>
                            <ContentDivider type="dashed" margin="x-small" />
                        </React.Fragment>
                    )}
                </ul>

                {this.state.eventModified === false ? null : (
                    <React.Fragment>
                        <Text size="small" className="mb-1 mt-0-5">
                            <strong>{gettext('This is a recurring event.')}</strong>
                            {gettext('Update all recurring events or just this one?')}
                        </Text>
                        <Select
                            label={gettext('Update all recurring events or just this one?')}
                            labelHidden={true}
                            inlineLabel={true}
                            value={this.state.eventUpdateMethod}
                            onChange={this.onEventUpdateMethodChange}
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
                    </React.Fragment>
                )}
                {this.renderModifiedPlanningItems()}
            </React.Fragment>
        );
    }
}

const mapStateToProps = (state) => ({
    originalPlanningItems: storedPlannings(state),
    eventProfile: eventProfile(state),
});

const mapDispatchToProps = (dispatch: any, ownProps: IOwnProps) => ({
    onSubmit: (original, updates) => (
        dispatch(actions.main.save(original, updates, false))
            .then((savedItem) => {
                if (ownProps.modalProps.unlockOnClose) {
                    planningApi.locks.unlockItem(savedItem);
                }

                if (ownProps.resolve != null) {
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
