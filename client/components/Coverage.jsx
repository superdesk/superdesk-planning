import React from 'react'
import { fields } from './index'
import { Field } from 'redux-form'
import { connect } from 'react-redux'

function CoverageComponent({ g2_content_type, coverage }) {
    return (
        <fieldset>
            <Field
                name={`${coverage}.planning.ednote`}
                component={fields.InputField}
                type="text"
                label="Description"/>
            <label>Type</label>
            <Field
                name={`${coverage}.planning.g2_content_type`}
                component="select">
                <option />
                {g2_content_type.map((t) => (
                    <option key={t.qcode} value={t.qcode}>{t.name}</option>
                ))}
            </Field>
            <label>Due</label>
            <Field
                name={`${coverage}.planning.scheduled`}
                component={fields.DayPickerInput}
                withTime={true} />
        </fieldset>
    )
}

CoverageComponent.propTypes = {
    coverage: React.PropTypes.string.isRequired,
    g2_content_type: React.PropTypes.array.isRequired,
}

const mapStateToProps = (state) => ({
    g2_content_type: state.vocabularies.g2_content_type
})

export const Coverage = connect(mapStateToProps)(CoverageComponent)
