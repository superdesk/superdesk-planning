import {planningApi, superdeskApi} from '../../../superdeskApi';
import {authoringStorageEventItemHttp} from '../../../components/editor-standalone/authoring-storage-event-http';
import {EventEditorStandalone} from '../../../components/editor-standalone/event-editor-standalone';
import {RelatedEventListItem} from '../../../components/Events/EventMetadata/RelatedEventListItem';
import React, {createRef} from 'react';
import {IconButton, ToggleBox} from 'superdesk-ui-framework/react';
import {IAuthoringReact} from 'superdesk-api';
import {eventUtils, isTemporaryId} from '../../../utils';
import {getAuthoringStorageInMemory} from '../../../components/editor-standalone/authoring-storage-in-memory';
import * as eventsApi from '../../../api/events';
import {omit} from 'lodash';

interface IProps{
    unlinkEvent(item: DeepPartial<IEventItem>): void;
    updateEventItem(item: IEventItem, updates: IEventItem, scrollOnChange: boolean): void;
    event: IEventItem;
    index: number;
    disabled?: boolean;
}

export class AssociatedEventItem extends React.PureComponent<IProps> {
    public toggleBoxRef: React.RefObject<any>;
    public authoringRef: React.RefObject<IAuthoringReact<IEventItem>>;
    containerNode: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.containerNode = React.createRef();
        this.toggleBoxRef = createRef();
        this.authoringRef = createRef();
    }

    scrollIntoView() {
        this.containerNode.current?.scrollIntoView({behavior: 'smooth'});
    }

    update(updates: IEventItem, scrollOnChange: boolean = true) {
        this.props.updateEventItem(this.props.event, updates, scrollOnChange);
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
                        ariaValue={gettext('Unlink related event')}
                        toolTipFlow="left"
                        onClick={() => {
                            this.props.unlinkEvent(event);
                        }}
                        icon="close-small"
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
                                    return eventsApi.events.create(
                                        omit(
                                            eventUtils.modifyForServer(item),
                                            ['_endTime', '_startTime']
                                        )
                                    ).then(([createdEvent]) => {
                                        this.update(createdEvent);

                                        return createdEvent;
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
