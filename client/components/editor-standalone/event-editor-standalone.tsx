import React, {createRef, RefObject} from 'react';
import {IAuthoringStorage} from 'superdesk-api';
import {BaseEditorComponent, BaseEditorStandalone} from './base-editor-standalone';
import {getStorageAdapter} from './storage-adapter';

interface IProps {
    itemId: string;
    authoringStorage: IAuthoringStorage<IEventItem>;
}

export class EventEditorStandalone extends React.PureComponent<IProps> {
    editorRef: RefObject<BaseEditorComponent<IEventItem>>;

    constructor(props) {
        super(props);

        this.editorRef = createRef();
    }

    render() {
        return (
            <BaseEditorStandalone
                entityType="event"
                ref={this.editorRef}
                itemId={this.props.itemId}
                storageAdapter={getStorageAdapter('event', ({storageAdapterEvent}) => storageAdapterEvent)}
                authoringStorage={this.props.authoringStorage}
            />
        );
    }
}
