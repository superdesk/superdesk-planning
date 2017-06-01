import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { Field, reduxForm, formValueSelector, propTypes } from 'redux-form'
import { fields } from '../../components'
import { ITEM_STATE } from '../../constants'
import { get } from 'lodash'
import './style.scss'

function AdvancedSearchFormComponent({ handleSubmit, pristine, reset, submitting, error, resetSearch }) {
    return (
        <form onSubmit={handleSubmit} className="AdvancedSearchForm">
            <fieldset>
                <Field name="name"
                       component={fields.InputField}
                       type="text"
                       label="What"/>
                <Field name="source"
                       component={fields.IngestProviderField}
                       type="text"
                       label="Ingest Source"/>
                <Field name="location"
                       component={fields.InputField}
                       type="text"
                       label="Location"/>
               <Field name="anpa_category"
                       component={fields.CategoryField}
                       label="Category"/>
                <Field name="subject"
                       component={fields.SubjectField}
                       label="Subject"/>
                <Field name="state"
                       component={fields.EventStateField}
                       label="Event State"/>
                <br/>&nbsp;From&nbsp;<br/>
                <Field name="dates.start"
                       component={fields.DayPickerInput}
                       withTime={true}/>
                <br/>&nbsp;To&nbsp;<br/>
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

AdvancedSearchFormComponent.propTypes = propTypes

// Decorate the form component
const FormComponent = reduxForm({
    form: 'advanced-search', // a unique name for this form
    enableReinitialize: true, //the form will reinitialize every time the initialValues prop changes
})(AdvancedSearchFormComponent)

const selector = formValueSelector('advanced-search') // same as form name
const mapStateToProps = (state) => ({
    startingDate: selector(state, 'dates.start'),
    endingDate: selector(state, 'dates.end'),
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (form) => (
        dispatch(actions.fetchEvents({
            advancedSearch: form,
            state: get(form, 'state.value', ITEM_STATE.ACTIVE),
        }))
    ),
    resetSearch: () => (dispatch(actions.fetchEvents())),
})

export const AdvancedSearchForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true }
)(FormComponent)
