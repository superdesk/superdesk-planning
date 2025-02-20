import {superdeskApi} from '../../../superdeskApi';
import {authoringStorageEventItemHttp} from '../../../components/editor-standalone/authoring-storage-event-http';
import {EventEditorStandalone} from '../../../components/editor-standalone/event-editor-standalone';
import {RelatedEventListItem} from '../../../components/Events/EventMetadata/RelatedEventListItem';
import React, {createRef} from 'react';
import {IconButton, ToggleBox} from 'superdesk-ui-framework/react';
import {IAuthoringReact} from 'superdesk-api';

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
                    )}
                >
                    <EventEditorStandalone
                        editorRef={this.authoringRef}
                        itemId={event._id}
                        authoringStorage={authoringStorageEventItemHttp}
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
