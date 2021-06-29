import React from 'react';

import {superdeskApi} from '../../superdeskApi';

import {MAIN, WORKFLOW_STATE} from '../../constants';
import {getWorkFlowStateAsOptions} from '../../utils';

import {PageContent} from '../PageContent';
import {PlanningSubNav} from './PlanningSubNav';
import {SearchPanel, Editor, PreviewPanel} from '../../components/Main';
import {PlanningList} from './PlanningList';

interface IProps {
    addNewsItemToPlanning: any;
    editorOpen: boolean;
    previewOpen: boolean;
    popupContainer(): void;
    onCancel(): void;
}

export class AddToPlanningUi extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            addNewsItemToPlanning,
            editorOpen,
            previewOpen,
            popupContainer,
            onCancel,
        } = this.props;

        return (
            <PageContent
                ariaTitle={gettext('Events and Planning content')}
                showModals={false}
                showWorkqueue={false}
                marginBottom={false}

                SubNavPanel={PlanningSubNav}
                subNavProps={{
                    showFilters: false,
                    withArchiveItem: true,
                    archiveItem: addNewsItemToPlanning,
                    createPlanningOnly: true,
                }}

                ListPanel={PlanningList}
                listProps={{
                    hideItemActions: true,
                    showAddCoverage: true,
                    showUnlock: false,
                }}

                previewOpen={previewOpen}
                PreviewPanel={PreviewPanel}
                previewProps={{
                    hideItemActions: true,
                    hideEditIcon: true,
                    showUnlock: false,
                }}

                editorOpen={editorOpen}
                EditorPanel={Editor}
                editorProps={{
                    addNewsItemToPlanning: addNewsItemToPlanning,
                    onCancel: onCancel,
                    showUnlock: false,
                    createAndPost: true,
                    hideMinimize: true,
                    hideItemActions: true,
                    hideExternalEdit: true,
                }}

                FilterPanel={SearchPanel}
                filterProps={{
                    popupContainer: popupContainer,
                    workflowStateOptions: getWorkFlowStateAsOptions(MAIN.FILTERS.PLANNING)
                        .filter((option) => (
                            ![WORKFLOW_STATE.RESCHEDULED, WORKFLOW_STATE.CANCELLED].includes(option.qcode)
                        )),
                }}
            />
        );
    }
}
