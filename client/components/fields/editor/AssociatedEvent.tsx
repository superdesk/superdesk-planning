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

        return (
            <Spacer v gap="16">
                <Spacer h gap="4" justifyContent="space-between" noWrap>
                    <label className="side-panel__heading side-panel__heading--big">
                        {gettext('Related Events')}
                    </label>
                    <Tooltip
                        content={
                            planningItemCreated
                                ? null
                                : gettext('Planning item has to be created before adding related events')
                        }
                    >
                        <Button
                            type="primary"
                            icon="plus-large"
                            text="plus-large"
                            shape="round"
                            size="small"
                            iconOnly={true}
                            onClick={this.addNewRelatedEvent}
                            disabled={disabled || !planningItemCreated}
                        />
                    </Tooltip>
                </Spacer>
                {events.length > 0 ? (
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
                ) : (
                    <EmptyState
                        title={gettext('No associated events have been added')}
                        description={
                            gettext('To add some, click the plus icon at the top right or drop an existing one')
                        }
                        illustration="1"
                        size="small"
                    />
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
                        {gettext('Drop events here')}
                    </DropZone>
                )}
            </Spacer>
        );
    }
}
