import React from 'react'
import { fields, CoverageAssign } from '../../components'
import { Field } from 'redux-form'
import { connect } from 'react-redux'
import classNames from 'classnames'
import './style.scss'

function CoverageComponent({ g2_content_type, coverage, users, desks, readOnly }) {
    return (
        <fieldset>
            <Field
                name={`${coverage}.planning.assigned_to`}
                component={CoverageAssign}
                users={users}
                desks={desks}
                readOnly={readOnly} />
            <Field
                name={`${coverage}.planning.ednote`}
                component={fields.InputField}
                type="text"
                label="Description"
                readOnly={readOnly} />
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
    coverage: React.PropTypes.string.isRequired,
    g2_content_type: React.PropTypes.array.isRequired,
    users: React.PropTypes.array.isRequired,
    desks: React.PropTypes.array.isRequired,
    readOnly: React.PropTypes.bool,
}

const mapStateToProps = (state) => ({
    g2_content_type: state.vocabularies.g2_content_type,
    users: state.users && state.users.length > 0 ? state.users : [],
    desks: state.desks && state.desks.length > 0 ? state.desks : [],
})

export const Coverage = connect(mapStateToProps)(CoverageComponent)
