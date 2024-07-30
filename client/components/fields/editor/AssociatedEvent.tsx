import * as React from 'react';
import {connect} from 'react-redux';

import {IEditorFieldProps, IEventItem, IFile, ILockedItems} from '../../../interfaces';

import {getFileDownloadURL} from '../../../utils';
import * as selectors from '../../../selectors';

import {EventMetadata} from '../../Events';

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

class EditorFieldAssociatedEventComponent extends React.PureComponent<IProps> {
    render() {
        return (this.props.events?.length ?? 0) < 1 ? null : this.props.events.map((event) => (
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
        ));
    }
}

export const EditorFieldAssociatedEvents = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldAssociatedEventComponent);
