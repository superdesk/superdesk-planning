import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import * as selectors from '../../selectors';

import {PageContent} from '../PageContent';
import {AssignmentList} from './AssignmentList';
import {AssignmentPreview} from './AssignmentPreview';
import {AssignmentsSubNav} from './AssignmentsSubNav';

export const AssignmentsAppComponent = ({previewOpen, showModals, showWorkqueue, marginBottom}) => (
    <PageContent
        showModals={showModals}
        showWorkqueue={showWorkqueue}
        marginBottom={marginBottom}
        widePreviewPanel={true}
        splitView={true}

        previewOpen={previewOpen}
        ListPanel={AssignmentList}
        PreviewPanel={AssignmentPreview}
        SubNavPanel={AssignmentsSubNav}
    />
);

AssignmentsAppComponent.propTypes = {
    previewOpen: PropTypes.bool,
    showModals: PropTypes.bool,
    showWorkqueue: PropTypes.bool,
    marginBottom: PropTypes.bool,
};

AssignmentsAppComponent.defaultProps = {
    showModals: true,
    showWorkqueue: false,
    marginBottom: true,
};

const mapStateToProps = (state) => ({
    previewOpen: selectors.getPreviewAssignmentOpened(state),
});

export const AssignmentsApp = connect(
    mapStateToProps
)(AssignmentsAppComponent);
