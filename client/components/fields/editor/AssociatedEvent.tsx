import * as React from 'react';
import {IEventItem, IPlanningRelatedEventLink} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';
import events from '../../../utils/events';
import {AssociatedEventItem} from './AssociatedEventItem';
import {IAssociatedEventFieldProps} from './AssociatedEventWrapper';

export class EditorFieldAssociatedEventComponent extends React.PureComponent<IAssociatedEventFieldProps> {
    public relatedItemRefs: {[id: string]: AssociatedEventItem};

    constructor(props: IAssociatedEventFieldProps) {
        super(props);

        this.relatedItemRefs = {};
        this.getCurrentValue = this.getCurrentValue.bind(this);
        this.addRelatedEvent = this.addRelatedEvent.bind(this);
        this.removeRelatedEvent = this.removeRelatedEvent.bind(this);
        this.relatedItemExists = this.relatedItemExists.bind(this);
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

    render() {
        const {gettext} = superdeskApi.localization;
        const {DropZone} = superdeskApi.components;
        const events = this.props.events ?? [];
        const disabled = this.props.disabled ?? false;

        return (
            <div>
                <label className="InputArray__label side-panel__heading side-panel__heading--big">
                    {gettext('Related Events')}
                </label>

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
