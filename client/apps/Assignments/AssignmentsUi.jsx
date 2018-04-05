import React from 'react';
import PropTypes from 'prop-types';
import {PageContent} from '../PageContent';
import {AssignmentList} from './AssignmentList';
import {AssignmentPreview} from './AssignmentPreview';
import {AssignmentsSubNav} from './AssignmentsSubNav';

export const AssignmentsUi = ({previewOpen, showModals, showWorkqueue, marginBottom}) => (
    <PageContent
        showWorkqueue={false}
        widePreviewPanel={true}
        splitView={true}

        previewOpen={previewOpen}
        ListPanel={AssignmentList}
        PreviewPanel={AssignmentPreview}
        SubNavPanel={AssignmentsSubNav}
    />
);

AssignmentsUi.propTypes = {
    previewOpen: PropTypes.bool,
    showModals: PropTypes.bool,
    showWorkqueue: PropTypes.bool,
    marginBottom: PropTypes.bool,
};

AssignmentsUi.defaultProps = {
    showModals: true,
    showWorkqueue: false,
    marginBottom: true,
};