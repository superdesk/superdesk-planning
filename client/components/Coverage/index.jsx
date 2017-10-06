import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { EditAssignment, CoverageDetails } from '../../components'
import * as selectors from '../../selectors'
import { Field, formValueSelector } from 'redux-form'
import './style.scss'

function CoverageComponent({
    coverage,
    usersMergedCoverageProviders,
    desks,
    readOnly,
    content_type,
    formProfile,
    keywords,
    }) {
    return (
        <fieldset>
            <Field
                name={`${coverage}.assigned_to`}
                component={EditAssignment}
                usersMergedCoverageProviders={usersMergedCoverageProviders}
                desks={desks}
                readOnly={readOnly}
                context="coverage" />
            <CoverageDetails
                coverage={coverage}
                formProfile={formProfile}
                readOnly={readOnly}
                content_type={content_type}
                keywords={keywords} />
        </fieldset>
    )
}

CoverageComponent.propTypes = {
    coverage: PropTypes.string.isRequired,
    content_type: PropTypes.string,
    usersMergedCoverageProviders: PropTypes.array.isRequired,
    desks: PropTypes.array.isRequired,
    readOnly: PropTypes.bool,
    formProfile: PropTypes.object,
    keywords: PropTypes.array,
}

const selector = formValueSelector('planning') // same as form name
const mapStateToProps = (state, ownProps) => ({
    usersMergedCoverageProviders: selectors.getUsersMergedCoverageProviders(state),
    desks: selectors.getDesks(state),
    content_type: selector(state, ownProps.coverage + '.planning.g2_content_type'),
    formProfile: selectors.getCoverageFormsProfile(state),
    keywords: selectors.getKeywords(state),
})

export const Coverage = connect(mapStateToProps)(CoverageComponent)
