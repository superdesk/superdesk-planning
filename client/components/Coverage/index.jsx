import React from 'react'
import PropTypes from 'prop-types'
import { fields, CoverageAssign } from '../../components'
import * as selectors from '../../selectors'
import { Field, formValueSelector } from 'redux-form'
import { connect } from 'react-redux'
import classNames from 'classnames'
import './style.scss'

function CoverageComponent({
    g2_content_type,
    coverage_providers,
    coverage,
    users,
    desks,
    readOnly,
    content_type,
    }) {
    const isTextCoverage = content_type === 'text'
    return (
        <fieldset>
            <Field
                name={`${coverage}.planning.assigned_to`}
                component={CoverageAssign}
                users={users}
                desks={desks}
                readOnly={readOnly} />
            <Field
                name={`${coverage}.planning.description_text`}
                component={fields.InputField}
                type="text"
                label="Description"
                readOnly={readOnly} />
            <Field
                name={`${coverage}.planning.ednote`}
                component={fields.InputField}
                type="text"
                label="Ed. Note"
                readOnly={readOnly} />
            <Field
                name={`${coverage}.planning.slugline`}
                component={fields.InputField}
                type="text"
                label="Slugline"
                readOnly={readOnly} />
            <Field
                name={`${coverage}.planning.headline`}
                component={fields.InputField}
                type="text"
                label="Headline"
                readOnly={readOnly} />
            <Field name={`${coverage}.planning.internal_note`}
                component={fields.InputTextAreaField}
                label="Internal Note"
                readOnly={readOnly}/>
            <label>Type</label>
            <Field
                name={`${coverage}.planning.g2_content_type`}
                component="select"
                className={classNames({ 'disabledInput': readOnly })}
                disabled={readOnly ? 'disabled' : ''} >
                <option />
                {g2_content_type.map((t) => (
                    <option key={t.qcode} value={t.qcode}>{t.name}</option>
                ))}
            </Field>
            {isTextCoverage && (
                <Field name={`${coverage}.planning.genre`}
                    component={fields.GenreField}
                    label="Genre"
                    readOnly={readOnly}/>
            )}
            <label>Provider</label>
            <Field
                name={`${coverage}.planning.coverage_provider`}
                component="select"
                className={classNames({ 'disabledInput': readOnly })}
                disabled={readOnly ? 'disabled' : ''} >
                <option />
                {coverage_providers.map((p) => (
                    <option key={p.qcode} value={p.qcode}>{p.name}</option>
                ))}
            </Field>
            <label>Due</label>
            <Field
                name={`${coverage}.planning.scheduled`}
                component={fields.DayPickerInput}
                withTime={true}
                readOnly={readOnly} />
        </fieldset>
    )
}

CoverageComponent.propTypes = {
    coverage: PropTypes.string.isRequired,
    g2_content_type: PropTypes.array.isRequired,
    content_type: PropTypes.string,
    coverage_providers: PropTypes.array.isRequired,
    users: PropTypes.array.isRequired,
    desks: PropTypes.array.isRequired,
    readOnly: PropTypes.bool,
}

const selector = formValueSelector('planning') // same as form name
const mapStateToProps = (state, ownProps) => ({
    g2_content_type: state.vocabularies.g2_content_type,
    users: selectors.getUsers(state),
    desks: state.desks && state.desks.length > 0 ? state.desks : [],
    content_type: selector(state, ownProps.coverage + '.planning.g2_content_type'),
    coverage_providers: state.vocabularies.coverage_providers || [],
})

export const Coverage = connect(mapStateToProps)(CoverageComponent)
