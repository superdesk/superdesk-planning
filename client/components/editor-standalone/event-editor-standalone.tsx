import React, {RefObject} from 'react';
import {IAuthoringStorage} from 'superdesk-api';
import {BaseEditorStandalone} from './base-editor-standalone';
import {getStorageAdapter} from './storage-adapter';
import {AuthoringReact} from 'apps/authoring-react/authoring-react';

interface IProps {
    itemId: string;
    authoringStorage: IAuthoringStorage<IEventItem>;
    editorRef: RefObject<AuthoringReact<IEventItem>>;
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
