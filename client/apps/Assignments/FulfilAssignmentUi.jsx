import React from 'react';
import PropTypes from 'prop-types';
import {PageContent} from '../PageContent';
import {AssignmentList} from './AssignmentList';
import {AssignmentPreview} from './AssignmentPreview';
import {AssignmentsSubNav} from './AssignmentsSubNav';

export const FulfilAssignmentUi = ({previewOpen, newsItem}) => (
    <PageContent
        showModals={false}
        showWorkqueue={false}
        marginBottom={false}
        widePreviewPanel={true}

        SubNavPanel={AssignmentsSubNav}
        subNavProps={{
            archiveItem: newsItem,
            onlyTodoAssignments: true,
            withArchiveItem: true,
        }}

        ListPanel={AssignmentList}
        listProps={{
            setMaxHeight: false,
            hideItemActions: true,
        }}

        editorOpen={previewOpen}
        EditorPanel={AssignmentPreview}
        editorProps={{
            hideItemActions: true,
            showFulfilAssignment: true,
        }}
    />
);

FulfilAssignmentUi.propTypes = {
    previewOpen: PropTypes.bool,
    newsItem: PropTypes.object,
};
