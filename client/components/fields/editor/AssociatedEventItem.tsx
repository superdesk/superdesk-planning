import {superdeskApi} from '../../../superdeskApi';
import {authoringStorageEventItemHttp} from '../../../components/editor-standalone/authoring-storage-event-http';
import {EventEditorStandalone} from '../../../components/editor-standalone/event-editor-standalone';
import {RelatedEventListItem} from '../../../components/Events/EventMetadata/RelatedEventListItem';
import React, {createRef} from 'react';
import {ToggleBox} from 'superdesk-ui-framework/react';

interface IProps{
    event: IEventItem;
}

export class AssociatedEventItem extends React.PureComponent<IProps> {
    public toggleBoxRef: React.RefObject<any>;
    public standaloneEditorRef: React.RefObject<EventEditorStandalone>;

    constructor(props) {
        super(props);

        this.toggleBoxRef = createRef();
        this.standaloneEditorRef = createRef();
    }

    render() {
        const {event} = this.props;
        const {gettext} = superdeskApi.localization;

        // PR-TODO: use different authoringStorage for creating a new event.
        return (
            <ToggleBox
                variant="custom-header"
                toggleBoxRef={this.toggleBoxRef}
                getToggleButtonLabel={(isOpen) => isOpen ? gettext('Show less') : gettext('Show more')}
                header={(
                    <RelatedEventListItem
                        item={event}
                        showIcon
                        showBorder
                    />
                )}
            >
                <EventEditorStandalone
                    ref={this.standaloneEditorRef}
                    itemId={event._id}
                    authoringStorage={authoringStorageEventItemHttp}
                />
            </ToggleBox>
        );
    }
}
