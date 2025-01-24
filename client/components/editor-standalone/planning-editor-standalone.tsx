import React, {ComponentType, RefObject} from 'react';
import {IAuthoringStorage, IPropsAuthoring} from 'superdesk-api';
import {BaseEditorStandalone} from './base-editor-standalone';
import {getStorageAdapter} from './storage-adapter';

interface IProps {
    itemId: string;
    authoringStorage: IAuthoringStorage<IPlanningItem>;
    editorRef: RefObject<ComponentType<IPropsAuthoring<IPlanningItem>>>;
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
