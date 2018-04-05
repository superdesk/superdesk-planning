import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import {AssignmentsUi} from './AssignmentsUi';
import {FulfilAssignmentUi} from './FulfilAssignmentUi';

const mapStateToProps = (state) => ({
    previewOpen: selectors.getPreviewAssignmentOpened(state),
});

export const AssignmentsApp = connect(
    mapStateToProps
)(AssignmentsUi);

export const FulfilAssignmentApp = connect(
    mapStateToProps
)(FulfilAssignmentUi);
