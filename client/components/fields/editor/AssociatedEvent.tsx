import * as React from 'react';
import {connect} from 'react-redux';

import {EDITOR_TYPE, IEditorFieldProps, IEventItem, IFile, ILockedItems, IPlanningItem} from '../../../interfaces';

import {getFileDownloadURL} from '../../../utils';
import * as selectors from '../../../selectors';

import {EventMetadata} from '../../Events';
import {planningApi, superdeskApi} from '../../../superdeskApi';
import {cloneDeep} from 'lodash';

interface IProps extends IEditorFieldProps {
    events?: Array<IEventItem>;
    lockedItems: ILockedItems;
    files: Array<IFile>;
    tabEnabled?: boolean; // defaults to true
}

const mapStateToProps = (state) => ({
    lockedItems: selectors.locks.getLockedItems(state),
    files: selectors.general.files(state),
});

function updateRelatedEvents(fn: (relatedEvents: IPlanningItem['related_events']) => IPlanningItem['related_events']) {
    const editor = planningApi.editor(EDITOR_TYPE.INLINE);
    const planningItem = editor.form.getDiff<IPlanningItem>();
    const nextRelatedEvents = fn(cloneDeep((planningItem as IPlanningItem).related_events ?? []));

    editor.form.changeField(
        'related_events',
        nextRelatedEvents,
        true,
        true,
    );
}

class EditorFieldAssociatedEventComponent extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.addRelatedEvent = this.addRelatedEvent.bind(this);
        this.removeRelatedEvent = this.removeRelatedEvent.bind(this);
        this.relatedItemExists = this.relatedItemExists.bind(this);
    }

    private addRelatedEvent(id: IEventItem['_id']) {
        updateRelatedEvents((relatedEvents) => [
            ...relatedEvents,
            {
                _id: id,
                link_type: 'secondary',
            },
        ]);
    }

    private removeRelatedEvent(id: IEventItem['_id']) {
        updateRelatedEvents((relatedEvents) => relatedEvents.filter((item) => item._id !== id));
    }

    private relatedItemExists(id: IEventItem['_id']) {
        return this.props.events.find((event) => event._id === id);
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

export const EditorFieldAssociatedEvents = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldAssociatedEventComponent);
