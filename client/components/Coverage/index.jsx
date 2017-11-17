import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { EditAssignment, CoverageDetails } from '../../components'
import * as selectors from '../../selectors'
import { FORM_NAMES } from '../../constants'
import { Field, formValueSelector } from 'redux-form'
import './style.scss'

function CoverageComponent({
    coverage,
    users,
    desks,
    readOnly,
    content_type,
    formProfile,
    keywords,
    coverageProviders,
    currentUserId,
    assignmentPriorities,
    assignmentState,
    hasAssignment,
    }) {
    return (
        <fieldset>
            <Field
                name={`${coverage}.assigned_to`}
                component={EditAssignment}
                users={users}
                currentUserId={currentUserId}
                desks={desks}
                coverageProviders={coverageProviders}
                readOnly={readOnly}
                assignmentPriorities={assignmentPriorities}
                context="coverage" />
            <CoverageDetails
                coverage={coverage}
                formProfile={formProfile}
                readOnly={readOnly}
                content_type={content_type}
                assignmentState={assignmentState}
                hasAssignment={hasAssignment}
                keywords={keywords} />
        </fieldset>
    )
}

CoverageComponent.propTypes = {
    coverage: PropTypes.string.isRequired,
    content_type: PropTypes.string,
    users: PropTypes.array.isRequired,
    desks: PropTypes.array.isRequired,
    coverageProviders: PropTypes.array,
    readOnly: PropTypes.bool,
    formProfile: PropTypes.object,
    keywords: PropTypes.array,
    currentUserId: PropTypes.string,
    assignmentPriorities: PropTypes.array,
    assignmentState: PropTypes.string,
    hasAssignment: PropTypes.bool,
}

const selector = formValueSelector(FORM_NAMES.PlanningForm) // same as form name
const mapStateToProps = (state, ownProps) => ({
    users: selectors.getUsers(state),
    currentUserId: selectors.getCurrentUserId(state),
    desks: selectors.getDesks(state),
    coverageProviders: selectors.getCoverageProviders(state),
    content_type: selector(state, ownProps.coverage + '.planning.g2_content_type'),
    assignmentState: selector(state, ownProps.coverage + '.assigned_to.state'),
    formProfile: selectors.getCoverageFormsProfile(state),
    keywords: selectors.getKeywords(state),
    assignmentPriorities: selectors.getAssignmentPriorities(state),
})

export const Coverage = connect(mapStateToProps)(CoverageComponent)
