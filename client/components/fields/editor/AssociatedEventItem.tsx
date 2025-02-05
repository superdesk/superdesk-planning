import {superdeskApi} from '../../../superdeskApi';
import {authoringStorageEventItemHttp} from '../../../components/editor-standalone/authoring-storage-event-http';
import {EventEditorStandalone} from '../../../components/editor-standalone/event-editor-standalone';
import {RelatedEventListItem} from '../../../components/Events/EventMetadata/RelatedEventListItem';
import React, {createRef} from 'react';
import {IconButton, ToggleBox} from 'superdesk-ui-framework/react';
import {AuthoringReact} from 'apps/authoring-react/authoring-react';

interface IProps{
    removeRef: () => void;
    removeEventItem(item: DeepPartial<IEventItem>): void;
    event: IEventItem;
    index: number;
    disabled?: boolean;
}

export class AssociatedEventItem extends React.PureComponent<IProps> {
    public toggleBoxRef: React.RefObject<any>;
    public authoringRef: React.RefObject<AuthoringReact<IEventItem>>;

    constructor(props) {
        super(props);

        this.toggleBoxRef = createRef();
        this.authoringRef = createRef();
    }

    componentWillUnmount(): void {
        this.props.removeRef();
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
                    />
                </ToggleBox>
            </div>
        );
    }
}
