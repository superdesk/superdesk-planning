/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import {PageContent} from '../PageContent';
import {AssignmentList} from './AssignmentList';
import {AssignmentPreview} from './AssignmentPreview';
import {AssignmentsSubNav} from './AssignmentsSubNav';

export const FulfilAssignmentUi = ({previewOpen, newsItem}) => {
    const assignmentListComponent = (props) => (
        <AssignmentList
            {...props}
            setMaxHeight={false}
            hideItemActions />
    );

    const assignmentPreviewComponent = (props) => (
        <AssignmentPreview
            {...props}
            hideItemActions
            showFulfilAssignment />
    );

    const assignmentsSubNavComponent = (props) => (
        <AssignmentsSubNav
            {...props}
            archiveItem={newsItem}
            onlyTodoAssignments
            withArchiveItem />
    );


    return (<PageContent
        showModals={false}
        showWorkqueue={false}
        marginBottom={false}
        widePreviewPanel={true}
        splitView={previewOpen}
        fullPreviewOpen={previewOpen}
        fullPreview

        ListPanel={assignmentListComponent}
        PreviewPanel={assignmentPreviewComponent}
        SubNavPanel={assignmentsSubNavComponent}
    />);
};

FulfilAssignmentUi.propTypes = {
    previewOpen: PropTypes.bool,
    newsItem: PropTypes.object,
};
