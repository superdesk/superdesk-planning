import * as React from 'react';
import {IEventItem, IPlanningRelatedEventLink} from '../../../interfaces';
import {planningApi, superdeskApi} from '../../../superdeskApi';
import events from '../../../utils/events';
import {AssociatedEventItem} from './AssociatedEventItem';
import {IAssociatedEventFieldProps} from './AssociatedEventWrapper';
import {Spacer, Button} from 'superdesk-ui-framework/react';
import {generateTempId, isTemporaryId} from '../../../utils';
import {convertPlanningToEvent} from '../../../actions/events/ui';
import {autosave} from '../../../api/autosave';
import {isEqual} from 'lodash';

export class EditorFieldAssociatedEventComponent extends React.PureComponent<IAssociatedEventFieldProps> {
    public relatedItemRefs: {[id: string]: AssociatedEventItem};

    constructor(props: IAssociatedEventFieldProps) {
        super(props);

        this.relatedItemRefs = {};
        this.getCurrentValue = this.getCurrentValue.bind(this);
        this.addRelatedEvent = this.addRelatedEvent.bind(this);
        this.relatedItemExists = this.relatedItemExists.bind(this);
        this.addNewRelatedEvent = this.addNewRelatedEvent.bind(this);
        this.lockRelatedItemsOnFrontEnd = this.lockRelatedItemsOnFrontEnd.bind(this);
    }

    private getCurrentValue(): Array<IPlanningRelatedEventLink> {
        const {field, item} = this.props;
        const relatedEvents = item[field] ?? [];

        return relatedEvents;
    }

    private addRelatedEvent(event: IEventItem) {
        events.addSomeEventsAsRelatedToPlanningEditor([event], (nextItems) => {
            this.props.onChange(
                this.props.field,
                nextItems,
            );

            this.props.onChange(
                '_unsaved_related_events',
                nextItems.filter((x) => isTemporaryId(x._id)),
            );

            return Promise.resolve();
        });
    }

    private relatedItemExists(id: IEventItem['_id']) {
        const {field, item} = this.props;
        const relatedEvents = item[field] ?? [];

        return relatedEvents.find((event) => event._id === id);
    }

    private addNewRelatedEvent() {
        const newEvent = {
            _id: generateTempId(),
            ...convertPlanningToEvent(this.props.item, planningApi.redux.store.getState, false)
        };

        return autosave.save(undefined, newEvent).then((autosavedEvent) => {
            this.addRelatedEvent(autosavedEvent as IEventItem);

            return autosavedEvent;
        });
    }

    private lockRelatedItemsOnFrontEnd() {
        if (this.props.disabled !== true) {
            planningApi.locks.softLockItem({
                type: 'planning',
                item: this.props.item,
                event_ids: this.props.events.map((x) => x._id)
            });
        }
    }

    componentDidUpdate(prevProps: Readonly<IAssociatedEventFieldProps>): void {
        const prevEventIds = prevProps.events.map((x) => x._id);
        const currentEventIds = this.props.events.map((x) => x._id);

        if (isEqual(prevEventIds, currentEventIds) === false) {
            this.lockRelatedItemsOnFrontEnd();
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {DropZone} = superdeskApi.components;
        const events = this.props.events ?? [];
        const disabled = this.props.disabled ?? false;
        const planningItemCreated = !isTemporaryId(this.props.item._id);
        const dropZoneText = (() => {
            if (planningItemCreated === false) {
                return gettext('Planning item has to be created before adding related events');
            } else if (events.length < 1) {
                return gettext('No events yet, drop some here, or click the plus button');
            } else {
                return gettext('Drop events here');
            }
        })();

        return (
            <Spacer v gap="16" noWrap>
                <Spacer h gap="4" justifyContent="space-between" noWrap>
                    <label className="side-panel__heading side-panel__heading--big">
                        {gettext('Related Events')}
                    </label>
                    {planningItemCreated && !disabled && (
                        <Button
                            type="primary"
                            icon="plus-large"
                            text="plus-large"
                            shape="round"
                            size="small"
                            iconOnly={true}
                            onClick={() => {
                                this.addNewRelatedEvent();
                            }}
                        />
                    )}
                </Spacer>
                {events.length > 0 && (
                    <Spacer gap="8" v>
                        {events.map((event, i) => (
                            <AssociatedEventItem
                                index={i}
                                // Newly added events have a temporary `_id` but no `_etag` yet
                                key={event._id}
                                event={event}
                                planningItem={this.props.item}
                                updateEventItem={(item, updates, scrollOnChange) =>
                                    this.props.updateEventItem(item as IEventItem, updates, scrollOnChange)
                                        .then(() => {
                                            // Wait for redux store to update
                                            setTimeout(() => {
                                                this.lockRelatedItemsOnFrontEnd();
                                            }, 100);
                                        })
                                }
                                unlinkEvent={(item) => {
                                    this.props.unlinkEvent(item);

                                    planningApi.locks.unlockEmbeddedItem(item);
                                }}
                                disabled={this.props.disabled}
                                ref={(ref) => {
                                    this.relatedItemRefs[i] = ref;
                                }}
                            />
                        ))}
                    </Spacer>
                )}
                {!disabled && (
                    <DropZone
                        canDrop={() => true}
                        onDrop={(event) => {
                            event.preventDefault();

                            const data = event.dataTransfer.getData('application/superdesk.planning.event');

                            if (data.length < 1) {
                                superdeskApi.ui.notify.error(gettext('Dropped item is not an event'));
                            } else {
                                const eventItem: IEventItem = JSON.parse(data);

                                this.addRelatedEvent(eventItem);
                            }
                        }}
                        multiple={true}
                    >
                        {dropZoneText}
                    </DropZone>
                )}
            </Spacer>
        );
    }
}
