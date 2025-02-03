import React from 'react';
import {connect} from 'react-redux';
import * as selectors from '../../../selectors';
import {EditorFieldAssociatedEventComponent} from './AssociatedEvent';
import {IEditorFieldProps, IFile, ILockedItems} from 'interfaces';

interface IReduxStoreProps {
    lockedItems: ILockedItems;
    files: Array<IFile>;
}

export interface IAssociatedEventFieldProps extends IEditorFieldProps {
    events?: Array<IEventItem>;
    tabEnabled?: boolean; // defaults to true
}

export type IAssociatedEventPropsAll = IAssociatedEventFieldProps & IReduxStoreProps;

export class AssociatedEventField extends React.PureComponent<IAssociatedEventPropsAll> {
    render() {
        return (
            <EditorFieldAssociatedEventComponent
                ref={this.props.refNode}
                {...this.props}
            />
        );
    }
}

const mapStateToProps = (state): IReduxStoreProps => ({
    lockedItems: selectors.locks.getLockedItems(state),
    files: selectors.general.files(state),
});

export const EditorFieldAssociatedEvents = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(AssociatedEventField);
