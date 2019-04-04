import React from 'react';
import PropTypes from 'prop-types';

import {MAIN, WORKFLOW_STATE} from '../../constants';
import {getWorkFlowStateAsOptions} from '../../utils';

import {PageContent} from '../PageContent';
import {PlanningSubNav} from './PlanningSubNav';
import {SearchPanel, Editor, PreviewPanel} from '../../components/Main';
import {PlanningList} from './PlanningList';

export const AddToPlanningUi = ({
    addNewsItemToPlanning,
    marginBottom,
    showModals,
    showWorkqueue,
    editorOpen,
    previewOpen,
    popupContainer,
    onCancel,
}) => (
    <PageContent
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

AddToPlanningUi.propTypes = {
    marginBottom: PropTypes.bool,
    addNewsItemToPlanning: PropTypes.object,
    showModals: PropTypes.bool,
    showWorkqueue: PropTypes.bool,
    editorOpen: PropTypes.bool,
    previewOpen: PropTypes.bool,
    popupContainer: PropTypes.func,
    onCancel: PropTypes.func,
};
