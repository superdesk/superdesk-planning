import React from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import * as actions from '../../actions'
import { Field, reduxForm, formValueSelector, propTypes } from 'redux-form'
import { fields } from '../../components'
import { SPIKED_STATE } from '../../constants'
import './style.scss'


function PlanningAdvancedSearchFormComponent({
    handleSubmit,
    pristine,
    reset,
    submitting,
    error,
    resetSearch,
    g2_content_type,
    daterange,
}) {
    return (
        <form onSubmit={handleSubmit} className="PlanningAdvancedSearchForm">
            <fieldset>
                <Field name="slugline"
                       component={fields.InputField}
                       type="text"
                       label="Slugline"/>
                <Field name="headline"
                       component={fields.InputField}
                       type="text"
                       label="Headline"/>
                <Field name="anpa_category"
                       component={fields.CategoryField}
                       label="Category"/>
                <Field name="subject"
                       component={fields.SubjectField}
                       label="Subject"/>
                <Field name="urgency"
                       component={fields.UrgencyField}
                       label="Urgency"/>
                <Field name="noCoverage"
                       defaultValue={false}
                       component={fields.ToggleField}
                       label="No Coverage"/>
                <label>Type</label>
                <Field
                    name="g2_content_type"
                    component="select">
                    <option />
                    {g2_content_type.map((t) => (
                        <option key={t.qcode} value={t.qcode}>{t.name}</option>
                    ))}
                </Field>
                <Field name="state"
                       component={fields.SpikeStateField}
                       label="Planning State"/>
                <label>Dates</label>
                <div>
                    <div className="daterange">
                        <Field name="dates.range"
                               component={fields.CheckboxField}
                               label="Today" currentValue={daterange}
                               value="today" type="radio"
                               labelPosition="inside" />

                        <Field name="dates.range"
                               component={fields.CheckboxField}
                               label="Last 24 hrs" currentValue={daterange}
                               value="last24" type="radio"
                               labelPosition="inside" />

                        <Field name="dates.range"
                               component={fields.CheckboxField}
                               label="This Week" currentValue={daterange}
                               value="week" type="radio"
                               labelPosition="inside" />
                    </div>
                    <div className="daterange--custom">
                        <label>From</label>
                        <Field name="dates.start"
                               component={fields.DayPickerInput}
                               withTime={true}/>
                        <label>To</label>
                        <Field name="dates.end"
                               component={fields.DayPickerInput}
                               withTime={true} />
                    </div>
                </div>
            </fieldset>
            <button
                className="btn btn-default"
                type="submit"
                disabled={pristine || submitting}>Submit</button>
            &nbsp;
            <button
                className="btn btn-default"
                onClick={()=>{reset(); resetSearch()}}
                type="button"
                name="clear"
                disabled={pristine || submitting}>Clear</button>
            {error && <div><strong>{error}</strong></div>}
        </form>
    )
}

PlanningAdvancedSearchFormComponent.propTypes = propTypes

// Decorate the form component
const FormComponent = reduxForm({
    form: 'planningAdvancedSearch', // a unique name for this form
    enableReinitialize: true, //the form will reinitialize every time the initialValues prop changes
})(PlanningAdvancedSearchFormComponent)

const selector = formValueSelector('planningAdvancedSearch') // same as form name
const mapStateToProps = (state) => ({
    startingDate: selector(state, 'dates.start'),
    endingDate: selector(state, 'dates.end'),
    g2_content_type: state.vocabularies.g2_content_type,
    daterange: selector(state, 'dates.range'),
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (form) => (dispatch(actions.planning.ui.search({
        advancedSearch: form,
        spikeState: get(form, 'state.value', SPIKED_STATE.NOT_SPIKED),
    }))),
    resetSearch: () => {
        return dispatch(actions.planning.ui.resetSearch())
    },
})

export const PlanningAdvancedSearchForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true }
)(FormComponent)
