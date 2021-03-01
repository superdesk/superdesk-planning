import React from 'react';

import {PageContent} from '../PageContent';
import {SearchPanel, Editor, PreviewPanel} from '../../components/Main';
import {PlanningSubNav} from './PlanningSubNav';
import {PlanningList} from './PlanningList';

interface IProps {
    editorOpen: boolean;
    previewOpen: boolean;
}

export class PlanningUi extends React.PureComponent<IProps> {
    render() {
        return (
            <PageContent
                editorOpen={this.props.editorOpen}
                previewOpen={this.props.previewOpen}
                SubNavPanel={PlanningSubNav}
                FilterPanel={SearchPanel}
                ListPanel={PlanningList}
                PreviewPanel={PreviewPanel}
                EditorPanel={Editor}
            />
        );
    }
}
