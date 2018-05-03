/* eslint-disable react/no-multi-comp */
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
}) => {
    const editorComponent = (props) => (
        <Editor
            {...props}
            addNewsItemToPlanning={addNewsItemToPlanning}
            showUnlock={false}
            createAndPost
            hideMinimize
            hideItemActions
            hideExternalEdit
        />
    );

    const subNavComponent = (props) => (
        <PlanningSubNav
            {...props}
            showFilters={false}
            withArchiveItem
            archiveItem={addNewsItemToPlanning}
            createPlanningOnly
        />
    );

    const searchPanelComponent = (props) => (
        <SearchPanel
            {...props}
            workflowStateOptions={getWorkFlowStateAsOptions(MAIN.FILTERS.PLANNING).filter(
                (option) => ![WORKFLOW_STATE.RESCHEDULED, WORKFLOW_STATE.CANCELLED].includes(option.qcode))}
        />
    );

    const planningListComponent = (props) => (
        <PlanningList
            {...props}
            hideItemActions
            showAddCoverage
            showUnlock={false}
        />
    );

    const previewPanelComponent = (props) => (
        <PreviewPanel
            {...props}
            hideItemActions
            hideEditIcon
            showUnlock={false}
        />
    );

    return (<PageContent
        editorOpen={editorOpen}
        previewOpen={previewOpen}
        marginBottom={false}
        SubNavPanel={subNavComponent}
        FilterPanel={searchPanelComponent}
        ListPanel={planningListComponent}
        showModals={false}
        showWorkqueue={false}
        PreviewPanel={previewPanelComponent}
        EditorPanel={editorComponent}
    />);
};

AddToPlanningUi.propTypes = {
    marginBottom: PropTypes.bool,
    addNewsItemToPlanning: PropTypes.object,
    showModals: PropTypes.bool,
    showWorkqueue: PropTypes.bool,
    editorOpen: PropTypes.bool,
    previewOpen: PropTypes.bool,
};
