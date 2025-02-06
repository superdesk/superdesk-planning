import React, {RefObject} from 'react';
import {IAuthoringStorage, IAuthoringReact} from 'superdesk-api';
import {BaseEditorStandalone} from './base-editor-standalone';
import {getStorageAdapter} from './storage-adapter';

interface IProps {
    itemId: string;
    authoringStorage: IAuthoringStorage<IPlanningItem>;
    editorRef: RefObject<IAuthoringReact<IPlanningItem>>;
}

export class PlanningEditorStandalone extends React.PureComponent<IProps> {
    render() {
        return (
            <BaseEditorStandalone
                editorRef={this.props.editorRef}
                entityType="planning"
                itemId={this.props.itemId}
                storageAdapter={getStorageAdapter('planning', ({storageAdapterPlanning}) => storageAdapterPlanning)}
                authoringStorage={this.props.authoringStorage}
            />
        );
    }
}
