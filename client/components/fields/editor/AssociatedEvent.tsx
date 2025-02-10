/* eslint-disable no-nested-ternary */
import * as React from 'react';
import {IEventItem, IPlanningRelatedEventLink} from '../../../interfaces';
import {planningApi, superdeskApi} from '../../../superdeskApi';
import events from '../../../utils/events';
import {AssociatedEventItem} from './AssociatedEventItem';
import {IAssociatedEventFieldProps} from './AssociatedEventWrapper';
import {Spacer, Button, EmptyState} from 'superdesk-ui-framework/react';
import {isTemporaryId, removeAutosaveFields} from '../../../utils';
import {convertPlanningToEvent} from '../../../actions/events/ui';
import {Tooltip} from '@sourcefabric/common';

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
        const newEvent = convertPlanningToEvent(this.props.item, planningApi.redux.store.getState);

        planningApi.events.create(removeAutosaveFields({...newEvent, associated_plannings: []}))
            .then(([firstResult]) => {
                this.addRelatedEvent(firstResult);
            });
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {DropZone} = superdeskApi.components;
        const events = this.props.events ?? [];
        const disabled = this.props.disabled ?? false;
        const planningItemCreated = !isTemporaryId(this.props.item._id);
        const dropZoneText = (() => {
            if (planningItemCreated === false) {
                return gettext('Event has to be created before adding related plannings');
            } else if (events.length < 1) {
                return gettext('No events yet, drop some here, or click the plus button');
            } else {
                return gettext('Drop events here');
            }
        })();

        return (
            <Spacer v gap="16">
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
                <Spacer gap="8" v>
                    {events.map((event, i) => (
                        <AssociatedEventItem
                            index={i}
                            key={event._id}
                            event={event}
                            removeEventItem={this.props.removeEventItem}
                            disabled={this.props.disabled}
                            ref={(ref) => {
                                this.relatedItemRefs[i] = ref;
                            }}
                        />
                    ))}
                </Spacer>
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
