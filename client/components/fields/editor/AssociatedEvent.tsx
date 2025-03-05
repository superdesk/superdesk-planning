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

export class EditorFieldAssociatedEventComponent extends React.PureComponent<IAssociatedEventFieldProps> {
    public relatedItemRefs: {[id: string]: AssociatedEventItem};

    constructor(props: IAssociatedEventFieldProps) {
        super(props);

        this.relatedItemRefs = {};
        this.getCurrentValue = this.getCurrentValue.bind(this);
        this.addRelatedEvent = this.addRelatedEvent.bind(this);
        this.removeRelatedEvent = this.removeRelatedEvent.bind(this);
        this.relatedItemExists = this.relatedItemExists.bind(this);
        this.addNewRelatedEvent = this.addNewRelatedEvent.bind(this);
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

    private removeRelatedEvent(id: IEventItem['_id']) {
        this.props.onChange(
            this.props.field,
            this.getCurrentValue().filter((item) => item._id !== id),
        );
    }

    private relatedItemExists(id: IEventItem['_id']) {
        const {field, item} = this.props;
        const relatedEvents = item[field] ?? [];

        return relatedEvents.find((event) => event._id === id);
    }

    private addNewRelatedEvent() {
        const newEvent = {
            _id: generateTempId(),
            ...convertPlanningToEvent(this.props.item, planningApi.redux.store.getState)
        };

        autosave.save(undefined, newEvent);

        // Item has to be available for PlanningEditor to load the related_events field.
        // Event objects are taken from the event store, since on the planning item
        // itself we only store link information.
        // planningApi.redux.store.dispatch<any>(eventsApi.receiveEvents([newEvent]));

        this.addRelatedEvent(newEvent as IEventItem);
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
                            onClick={this.addNewRelatedEvent}
                        />
                    )}
                </Spacer>
                {events.length > 0 && (
                    <Spacer gap="8" v>
                        {events.map((event, i) => (
                            <AssociatedEventItem
                                index={i}
                                key={event._id}
                                event={event}
                                updateEventItem={this.props.updateEventItem}
                                unlinkEvent={this.props.unlinkEvent}
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
                        canDrop={
                            (event) => event.dataTransfer.getData(
                                'application/superdesk.planning.event',
                            ) != null
                        }
                        onDrop={(event) => {
                            event.preventDefault();

                            const eventItem: IEventItem = JSON.parse(
                                event.dataTransfer.getData('application/superdesk.planning.event'),
                            );

                            this.addRelatedEvent(eventItem);
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
