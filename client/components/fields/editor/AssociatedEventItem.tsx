import {planningApi, superdeskApi} from '../../../superdeskApi';
import {authoringStorageEventItemHttp} from '../../../components/editor-standalone/authoring-storage-event-http';
import {EventEditorStandalone} from '../../../components/editor-standalone/event-editor-standalone';
import {RelatedEventListItem} from '../../../components/Events/EventMetadata/RelatedEventListItem';
import React, {createRef} from 'react';
import {IconButton, ToggleBox} from 'superdesk-ui-framework/react';
import {IAuthoringReact} from 'superdesk-api';
import {isTemporaryId} from '../../../utils';
import {getAuthoringStorageInMemory} from '../../../components/editor-standalone/authoring-storage-in-memory';
import eventsApi from '../../../actions/events/api';

interface IProps{
    removeEventItem(item: DeepPartial<IEventItem>): void;
    event: IEventItem;
    index: number;
    disabled?: boolean;
}

export class AssociatedEventItem extends React.PureComponent<IProps> {
    public toggleBoxRef: React.RefObject<any>;
    public authoringRef: React.RefObject<IAuthoringReact<IEventItem>>;

    constructor(props) {
        super(props);

        this.toggleBoxRef = createRef();
        this.authoringRef = createRef();
    }

    render() {
        const {event} = this.props;
        const {gettext} = superdeskApi.localization;
        const {WithLiveResources} = superdeskApi.components;
        const renderRelatedEvent = (event: IEventItem) => (
            <RelatedEventListItem
                item={event}
                showIcon
                showBorder
                eventActions={this.props.disabled ? null : (
                    <IconButton
                        ariaValue={gettext('Remove related event')}
                        toolTipFlow="left"
                        onClick={() => {
                            this.props.removeEventItem(event);
                        }}
                        icon="trash"
                    />
                )}
            />
        );

        return (
            <div
                data-test-id={`editor--event-item__${this.props.index}`}
                id={`planning-item--${this.props.event._id}`}
            >
                <ToggleBox
                    variant="custom-header"
                    toggleBoxRef={this.toggleBoxRef}
                    getToggleButtonLabel={(isOpen) => isOpen ? gettext('Show less') : gettext('Show more')}
                    alwaysRenderChildren
                    header={(
                        isTemporaryId(event._id) ?
                            renderRelatedEvent(event) : (
                                <WithLiveResources resources={[{ids: [event._id], resource: 'events'}]}>
                                    {(res) => renderRelatedEvent(res[0]._items[0] as IEventItem)}
                                </WithLiveResources>
                            )
                    )}
                >
                    <EventEditorStandalone
                        editorRef={this.authoringRef}
                        itemId={event._id}
                        authoringStorage={isTemporaryId(event._id)
                            ? getAuthoringStorageInMemory(
                                'event',
                                event,
                                (item) => {
                                    // TODO: Update planning item link after saving
                                    // event._planning_item; // the planning id this event is linked to
                                    // how is this linked properly?

                                    return planningApi.redux.store.dispatch<any>(eventsApi.save(undefined, item))
                                        .then(([updatedEvent]) => {
                                            return planningApi.planning.getById(event._planning_item).then((x) => {
                                                return planningApi.planning.update(x, {
                                                    ...x,
                                                    related_events: [
                                                        ...x.related_events.filter((x) => x._id != item._id),
                                                        {_id: updatedEvent._id, link_type: 'secondary'},
                                                    ],
                                                });
                                            });
                                        });
                                },
                            )
                            : authoringStorageEventItemHttp
                        }
                        makeVisible={() => {
                            if (this.toggleBoxRef.current.isOpen()) {
                                return Promise.resolve();
                            } else {
                                return new Promise((resolve) => {
                                    this.toggleBoxRef.current.toggle();

                                    // PR-TODO: improve toggleBox so `toggle` method returns a promise
                                    setTimeout(() => {
                                        resolve();
                                    }, 500);
                                });
                            }
                        }}
                    />
                </ToggleBox>
            </div>
        );
    }
}
