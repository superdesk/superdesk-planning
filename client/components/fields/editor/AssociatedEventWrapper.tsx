import React from 'react';
import {connect} from 'react-redux';
import * as selectors from '../../../selectors';
import {EditorFieldAssociatedEventComponent} from './AssociatedEvent';
import {IEditorFieldProps, IFile, ILockedItems} from 'interfaces';

export interface IAssociatedEventFieldProps extends IEditorFieldProps {
    events?: Array<IEventItem>;
    lockedItems: ILockedItems;
    files: Array<IFile>;
    tabEnabled?: boolean; // defaults to true
}

export class AssociatedEventField extends React.PureComponent<IAssociatedEventFieldProps> {
    render() {
        return (
            <EditorFieldAssociatedEventComponent
                ref={this.props.refNode}
                {...this.props}
            />
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
)(AssociatedEventField);
