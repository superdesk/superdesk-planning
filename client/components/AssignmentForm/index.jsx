import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Field, reduxForm, propTypes } from 'redux-form'
import { CoverageDetails, EditAssignment } from '../../components'
import * as selectors from '../../selectors'
import { get } from 'lodash'

export class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const {
            assignment,
            readOnly,
            desks,
            users,
            formProfile,
            handleSubmit,
            keywords,
            coverageProviders,
        } = this.props

        return (
            <form onSubmit={handleSubmit} className="AssignmentForm">
                <fieldset>
                    <Field
                        name={'assigned_to'}
                        component={EditAssignment}
                        users={users}
                        desks={desks}
                        coverageProviders={coverageProviders}
                        readOnly={readOnly} context={'assignment'} />

                    <label>Coverage Details</label>
                    <CoverageDetails
                        coverage={assignment}
                        formProfile={formProfile}
                        readOnly={true}
                        content_type={get(assignment, 'planning.g2_content_type')}
                        keywords={keywords}
                    />
                </fieldset>
            </form>
        )
    }
}

Component.propTypes = {
    ...propTypes,
    assignment: PropTypes.object,
    readOnly: PropTypes.bool,
    formProfile: PropTypes.object,
    users: PropTypes.array.isRequired,
    desks: PropTypes.array.isRequired,
    coverageProviders: PropTypes.array,
    keywords: PropTypes.array,
    onSubmit: PropTypes.func,
}

const mapStateToProps = (state) => ({
    initialValues: selectors.getCurrentAssignment(state),
    assignment: selectors.getCurrentAssignment(state),
    desks: selectors.getDesks(state),
    readOnly: selectors.getReadOnlyAssignment(state),
    formProfile: selectors.getCoverageFormsProfile(state),
    users: selectors.getUsers(state),
    coverageProviders: selectors.getCoverageProviders(state),
    keywords: selectors.getKeywords(state),
})

const AssignmentReduxForm = reduxForm({
    form: 'assignment',
    enableReinitialize: true, //the form will reinitialize every time the initialValues prop changes
})(Component)

export const AssignmentForm = connect(
    mapStateToProps,
    null,
    null,
    { withRef: true })(AssignmentReduxForm)
