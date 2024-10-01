import * as React from 'react';
import {connect} from 'react-redux';
import {EDITOR_TYPE, IEditorFieldProps, IEventItem, IFile, ILockedItems, IPlanningItem} from '../../../interfaces';
import {getFileDownloadURL, gettext} from '../../../utils';
import * as selectors from '../../../selectors';
import {EventMetadata} from '../../Events';
import {DropZone3} from 'superdesk-core/scripts/core/ui/components/drop-zone-3';
import {planningApi} from '../../../../client/superdeskApi';
import {cloneDeep} from 'lodash';

interface IProps extends IEditorFieldProps {
    events?: Array<IEventItem>;
    lockedItems: ILockedItems;
    files: Array<IFile>;
    tabEnabled?: boolean; // defaults to true
    dispatch: (action) => Promise<IEventItem>;
}

const mapStateToProps = (state) => ({
    lockedItems: selectors.locks.getLockedItems(state),
    files: selectors.general.files(state),
});

const mapDispatchToProps = (dispatch) => ({
    dispatch,
});

function dropEventItem(newPlanningItem: IEventItem) {
    const editor = planningApi.editor(EDITOR_TYPE.INLINE);
    const event = editor.form.getDiff<IPlanningItem>();

    const plans = cloneDeep(event.related_events || []);

    plans.push({_id: newPlanningItem._id});

    editor.form.changeField('related_events', plans, true, true);
}

function canDrop(eventItem: IEventItem) {
    if (eventItem.type !== 'event' || this.props.item.events.includes(eventItem)) {
        return false;
    }
    return true;
}

class EditorFieldAssociatedEventComponent extends React.PureComponent<IProps> {
    render() {
        return (
            <div>
                <label className="InputArray__label side-panel__heading side-panel__heading--big">
                    {gettext('Related Events')}
                </label>
                {(this.props.events?.length ?? 0) < 1 ? null : this.props.events.map((event) => (
                    <EventMetadata
                        key={event._id}
                        ref={this.props.refNode}
                        testId={`${this.props.testId}--${event._id}`}
                        event={event}
                        navigation={{}}
                        createUploadLink={getFileDownloadURL}
                        files={this.props.files}
                        tabEnabled={this.props.tabEnabled ?? true}
                    />
                ))}

                <DropZone3
                    className="basic-drag-block"
                    canDrop={(event) => canDrop(
                        JSON.parse(event.dataTransfer.getData('application/superdesk.planningItem'))
                    )}
                    onDrop={(event) => {
                        event.preventDefault();
                        const eventItem = JSON.parse(
                            event.dataTransfer.getData('application/superdesk.planningItem')
                        );

                        dropEventItem(eventItem);
                    }}
                    multiple={true}
                />
            </div>
        );
    }
}

export const EditorFieldAssociatedEvents = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {forwardRef: true}
)(EditorFieldAssociatedEventComponent);
