import * as React from 'react';
import {IEventItem, IPlanningRelatedEventLink} from '../../../interfaces';
import {planningApi, superdeskApi} from '../../../superdeskApi';
import events from '../../../utils/events';
import {AssociatedEventItem} from './AssociatedEventItem';
import {IAssociatedEventPropsAll} from './AssociatedEventWrapper';
import {Spacer, Button, Tooltip} from 'superdesk-ui-framework/react';
import {isTemporaryId, removeAutosaveFields} from '../../../utils';
import {convertPlanningToEvent} from '../../../actions/events/ui';

export class EditorFieldAssociatedEventComponent extends React.PureComponent<IAssociatedEventPropsAll> {
    public relatedItemRefs: {[id: string]: AssociatedEventItem};

    constructor(props: IAssociatedEventPropsAll) {
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

        return (
            <div>
                <Spacer h gap="4" justifyContent="space-between" noWrap>
                    <label className="InputArray__label side-panel__heading side-panel__heading--big">
                        {gettext('Related Events')}
                    </label>
                    <Tooltip
                        flow="left"
                        text={gettext('Item not saved or you\'re in preview')}
                        disabled={disabled !== true && isTemporaryId(this.props.item._id) === false}
                    >
                        <Button
                            type="primary"
                            icon="plus-large"
                            text="plus-large"
                            shape="round"
                            size="small"
                            iconOnly={true}
                            onClick={this.addNewRelatedEvent}
                            disabled={disabled || isTemporaryId(this.props.item._id)}
                        />
                    </Tooltip>
                </Spacer>
                {events.map((event, i) => (
                    <AssociatedEventItem
                        key={event._id}
                        event={event}
                        ref={(ref) => {
                            this.relatedItemRefs[i] = ref;
                        }}
                    />
                ))}
                {
                    !disabled && (
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
                    )
                }
            </div>
        );
    }
}
