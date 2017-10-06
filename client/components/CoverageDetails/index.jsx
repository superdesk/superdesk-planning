import React from 'react'
import PropTypes from 'prop-types'
import { fields } from '../../components'
import { Field } from 'redux-form'
import { get } from 'lodash'

export const CoverageDetails = ({
    coverage,
    readOnly,
    content_type,
    formProfile,
    keywords,
    }) => {
    const isTextCoverage = content_type === 'text'
    // for assignment form coverage props is object
    // for coverage form coverage props is string
    const fieldNamePrefix = typeof coverage === 'string' ? `${coverage}.` : ''
    return (
        <div>
            {get(formProfile, 'editor.slugline.enabled') &&
                <div className="form__row">
                    <Field
                        name={`${fieldNamePrefix}planning.slugline`}
                        component={fields.InputField}
                        type="text"
                        label="Slugline"
                        required={get(formProfile, 'schema.slugline.required')}
                        readOnly={readOnly} />
                </div>
            }
            {get(formProfile, 'editor.ednote.enabled') &&
                <div className="form__row">
                    <Field
                    name={`${fieldNamePrefix}planning.ednote`}
                    component={fields.InputTextAreaField}
                    autoFocus={true}
                    type="text"
                    label="Ed Note"
                    required={get(formProfile, 'schema.ednote.required')}
                    readOnly={readOnly} />
                </div>
            }
            {get(formProfile, 'editor.keyword.enabled') &&
                <div className="form__row">
                    <Field
                        name={`${coverage}.planning.keyword`}
                        component={fields.TagSelectField}
                        label="Keywords"
                        required={get(formProfile, 'schema.keyword.required')}
                        options={keywords}
                        readOnly={readOnly} />
                </div>
            }
            {get(formProfile, 'editor.internal_note.enabled') &&
                <div className="form__row">
                    <Field
                        name={`${fieldNamePrefix}planning.internal_note`}
                        component={fields.InputTextAreaField}
                        label="Internal Note"
                        required={get(formProfile, 'schema.internal_note.required')}
                        readOnly={readOnly}/>
                </div>
            }

            {get(formProfile, 'editor.g2_content_type.enabled') &&
                <div className="form__row">
                    <Field
                        name={`${fieldNamePrefix}planning.g2_content_type`}
                        component={fields.ContentTypeField}
                        label="Type"
                        clearable={true}
                        required={get(formProfile, 'schema.g2_content_type.required')}
                        readOnly={readOnly} />
                </div>
            }

            {get(formProfile, 'editor.genre.enabled') && isTextCoverage && (
                <div className="form__row">
                    <Field name={`${fieldNamePrefix}planning.genre`}
                        component={fields.GenreField}
                        label="Genre"
                        readOnly={readOnly}/>
                </div>
            )}
            <div className="form__row">
                <Field
                    name={`${fieldNamePrefix}news_coverage_status`}
                    component={fields.CoverageStatusField}
                    label="Coverage Status"
                    clearable={false}
                    readOnly={readOnly} />
            </div>

            {get(formProfile, 'editor.scheduled.enabled') &&
                <Field
                    name={`${fieldNamePrefix}planning.scheduled`}
                    component={fields.DayPickerInput}
                    withTime={true}
                    label="Due"
                    readOnly={readOnly} />
            }
        </div>
    )
}

CoverageDetails.propTypes = {
    coverage: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]).isRequired,
    content_type: PropTypes.string,
    readOnly: PropTypes.bool,
    formProfile: PropTypes.object,
    keywords: PropTypes.array,
}
