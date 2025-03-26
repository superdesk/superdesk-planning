import React from 'react';
import {EditorFieldAssociatedEventComponent} from './AssociatedEvent';
import {IEditorFieldProps} from 'interfaces';

export interface IAssociatedEventFieldProps extends IEditorFieldProps {
    events?: Array<IEventItem>;
    tabEnabled?: boolean; // defaults to true
    unlinkEvent(item: DeepPartial<IEventItem>): void;
    updateEventItem(item: IEventItem, updates: IEventItem, scrollOnChange: boolean): void;
}

export class EditorFieldAssociatedEvents extends React.PureComponent<IAssociatedEventFieldProps> {
    render() {
        return (
            <EditorFieldAssociatedEventComponent
                ref={this.props.refNode}
                {...this.props}
            />
        );
    }
}
