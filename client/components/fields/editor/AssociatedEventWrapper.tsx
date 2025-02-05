import React from 'react';
import {connect} from 'react-redux';
import * as selectors from '../../../selectors';
import {EditorFieldAssociatedEventComponent} from './AssociatedEvent';
import {IEditorFieldProps, IFile} from 'interfaces';

interface IReduxStoreProps {
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
    files: selectors.general.files(state),
});

export const EditorFieldAssociatedEvents = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(AssociatedEventField);
