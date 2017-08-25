import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { fields, CoverageAssign } from '../../components'
import * as selectors from '../../selectors'
import { Field, formValueSelector } from 'redux-form'
import './style.scss'
import { get } from 'lodash'

function CoverageComponent({
    g2_content_type,
    coverage_providers,
    coverage,
    users,
    desks,
    readOnly,
    content_type,
    formProfile,
    newscoveragestatus,
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
            {get(formProfile, 'editor.ednote.enabled') && <Field
                name={`${coverage}.planning.ednote`}
                component={fields.InputTextAreaField}
                multiLine={true}
                autoFocus={true}
                type="text"
                label="Ed Note"
                readOnly={readOnly} />}
            {get(formProfile, 'editor.slugline.enabled') && <Field
                name={`${coverage}.planning.slugline`}
                component={fields.InputField}
                type="text"
                label="Slugline"
                readOnly={readOnly} />}
            {get(formProfile, 'editor.headline.enabled') && <Field
                name={`${coverage}.planning.headline`}
                component={fields.InputField}
                type="text"
                label="Headline"
                readOnly={readOnly} />}
            {get(formProfile, 'editor.internal_note.enabled') && <Field
                name={`${coverage}.planning.internal_note`}
                component={fields.InputTextAreaField}
                label="Internal Note"
                readOnly={readOnly}/>}
            <label>Type</label>
            {get(formProfile, 'editor.g2_content_type.enabled') && <Field
                name={`${coverage}.planning.g2_content_type`}
                component="select"
                className={classNames({ 'disabledInput': readOnly })}
                disabled={readOnly ? 'disabled' : ''} >
                <option />
                {g2_content_type.map((t) => (
                    <option key={t.qcode} value={t.qcode}>{t.name}</option>
                ))}
            </Field>}
            {get(formProfile, 'editor.genre.enabled') && isTextCoverage && (
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
            <label>Coverage Status</label>
            <Field
                name={`${coverage}.news_coverage_status.qcode`}
                component="select"
                className={classNames({ 'disabledInput': readOnly })}
                disabled={readOnly ? 'disabled' : ''} >
                <option />
                {newscoveragestatus.map((p) => (
                    <option key={p.qcode} value={p.qcode}>{p.label}</option>
                ))}
            </Field>
            <label>Due</label>
            {get(formProfile, 'editor.scheduled.enabled') && <Field
                name={`${coverage}.planning.scheduled`}
                component={fields.DayPickerInput}
                withTime={true}
                readOnly={readOnly} />}
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
    formProfile: PropTypes.object,
    newscoveragestatus: PropTypes.array.isRequired,
}

const selector = formValueSelector('planning') // same as form name
const mapStateToProps = (state, ownProps) => ({
    g2_content_type: state.vocabularies.g2_content_type,
    users: selectors.getUsers(state),
    desks: state.desks && state.desks.length > 0 ? state.desks : [],
    content_type: selector(state, ownProps.coverage + '.planning.g2_content_type'),
    coverage_providers: state.vocabularies.coverage_providers || [],
    formProfile: selectors.getCoverageFormsProfile(state),
    newscoveragestatus: state.vocabularies.newscoveragestatus || [],
})

export const Coverage = connect(mapStateToProps)(CoverageComponent)
