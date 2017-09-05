import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { fields, CoverageAssign } from '../../components'
import * as selectors from '../../selectors'
import { Field, formValueSelector } from 'redux-form'
import './style.scss'
import { get } from 'lodash'

function CoverageComponent({
    coverage,
    usersMergedCoverageProviders,
    desks,
    readOnly,
    content_type,
    formProfile,
    }) {
    const isTextCoverage = content_type === 'text'
    return (
        <fieldset>
            <Field
                name={`${coverage}.planning.assigned_to`}
                component={CoverageAssign}
                usersMergedCoverageProviders={usersMergedCoverageProviders}
                desks={desks}
                readOnly={readOnly} />
            {get(formProfile, 'editor.slugline.enabled') &&
                <div className="form__row">
                    <Field
                        name={`${coverage}.planning.slugline`}
                        component={fields.InputField}
                        type="text"
                        label="Slugline"
                        readOnly={readOnly} />
                </div>
            }
            {get(formProfile, 'editor.ednote.enabled') &&
                <div className="form__row">
                    <Field
                    name={`${coverage}.planning.ednote`}
                    component={fields.InputTextAreaField}
                    autoFocus={true}
                    type="text"
                    label="Ed Note"
                    readOnly={readOnly} />
                </div>
            }
            {get(formProfile, 'editor.internal_note.enabled') &&
                <div className="form__row">
                    <Field
                        name={`${coverage}.planning.internal_note`}
                        component={fields.InputTextAreaField}
                        label="Internal Note"
                        readOnly={readOnly}/>
                </div>
            }

            {get(formProfile, 'editor.g2_content_type.enabled') &&
                <div className="form__row">
                    <Field
                        name={`${coverage}.planning.g2_content_type`}
                        component={fields.ContentTypeField}
                        label="Type"
                        clearable={true}
                        readOnly={readOnly} />
                </div>
            }

            {get(formProfile, 'editor.genre.enabled') && isTextCoverage && (
                <div className="form__row">
                    <Field name={`${coverage}.planning.genre`}
                        component={fields.GenreField}
                        label="Genre"
                        readOnly={readOnly}/>
                </div>
            )}
            <div className="form__row">
                <Field
                    name={`${coverage}.news_coverage_status`}
                    component={fields.CoverageStatusField}
                    label="Coverage Status"
                    clearable={false}
                    readOnly={readOnly} />
            </div>

            {get(formProfile, 'editor.scheduled.enabled') &&
                <Field
                    name={`${coverage}.planning.scheduled`}
                    component={fields.DayPickerInput}
                    withTime={true}
                    label="Due"
                    readOnly={readOnly} />
            }
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
}

const selector = formValueSelector('planning') // same as form name
const mapStateToProps = (state, ownProps) => ({
    g2_content_type: state.vocabularies.g2_content_type,
    usersMergedCoverageProviders: selectors.getUsersMergedCoverageProviders(state),
    desks: state.desks && state.desks.length > 0 ? state.desks : [],
    content_type: selector(state, ownProps.coverage + '.planning.g2_content_type'),
    formProfile: selectors.getCoverageFormsProfile(state),
})

export const Coverage = connect(mapStateToProps)(CoverageComponent)
