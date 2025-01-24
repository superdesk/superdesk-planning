import React, {RefObject} from 'react';
import {IAuthoringStorage, IPropsAuthoring} from 'superdesk-api';
import {BaseEditorStandalone} from './base-editor-standalone';
import {getStorageAdapter} from './storage-adapter';

interface IProps {
    itemId: string;
    authoringStorage: IAuthoringStorage<IEventItem>;
    editorRef: RefObject<React.ComponentType<IPropsAuthoring<IEventItem>>>;
}

export class EventEditorStandalone extends React.PureComponent<IProps> {
    render() {
        return (
            <BaseEditorStandalone
                entityType="event"
                editorRef={this.props.editorRef}
                itemId={this.props.itemId}
                storageAdapter={getStorageAdapter('event', ({storageAdapterEvent}) => storageAdapterEvent)}
                authoringStorage={this.props.authoringStorage}
            />
        );
    }
}
