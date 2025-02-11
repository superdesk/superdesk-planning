import React, {RefObject} from 'react';
import {IAuthoringReact, IAuthoringStorage, IPropsAuthoring} from 'superdesk-api';
import {BaseEditorStandalone} from './base-editor-standalone';
import {getStorageAdapter} from './storage-adapter';

interface IProps {
    itemId: string;
    authoringStorage: IAuthoringStorage<IEventItem>;
    editorRef: RefObject<IAuthoringReact<IEventItem>>;
    makeVisible: IPropsAuthoring<IEventItem>['makeVisible'];
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
                makeVisible={this.props.makeVisible}
            />
        );
    }
}
