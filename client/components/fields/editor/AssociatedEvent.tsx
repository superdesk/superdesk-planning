import * as React from 'react';
import {connect} from 'react-redux';

import {IEditorFieldProps, IEventItem, IFile, ILockedItems, IPlanningRelatedEventLink} from '../../../interfaces';

import {getFileDownloadURL} from '../../../utils';
import * as selectors from '../../../selectors';

import {EventMetadata} from '../../Events';
import {superdeskApi} from '../../../superdeskApi';

interface IProps extends IEditorFieldProps {
    events?: Array<IEventItem>;
    lockedItems: ILockedItems;
    files: Array<IFile>;
    tabEnabled?: boolean; // defaults to true
}

class EditorFieldAssociatedEventComponent extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

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

    private addRelatedEvent(id: IEventItem['_id']) {
        this.props.onChange(
            this.props.field,
            [
                ...this.getCurrentValue(),
                {
                    _id: id,
                    link_type: 'secondary',
                },
            ],
        );
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

                {
                    events.map((event) => (
                        <EventMetadata
                            key={event._id}
                            ref={this.props.refNode}
                            testId={`${this.props.testId}--${event._id}`}
                            event={event}
                            navigation={{}}
                            createUploadLink={getFileDownloadURL}
                            files={this.props.files}
                            tabEnabled={this.props.tabEnabled ?? true}
                            onRemoveEvent={
                                disabled
                                    ? undefined
                                    : () => {
                                        this.removeRelatedEvent(event._id);
                                    }
                            }
                        />
                    ))
                }

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

                                if (this.relatedItemExists(eventItem._id)) {
                                    superdeskApi.ui.notify.error(gettext('This item is already added'));
                                } else {
                                    this.addRelatedEvent(eventItem._id);
                                }
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

const mapStateToProps = (state) => ({
    lockedItems: selectors.locks.getLockedItems(state),
    files: selectors.general.files(state),
});

export const EditorFieldAssociatedEvents = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldAssociatedEventComponent);
