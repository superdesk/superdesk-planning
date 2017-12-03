import React from 'react';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {Field, reduxForm, formValueSelector, propTypes} from 'redux-form';
import {fields} from '../../components';
import {SPIKED_STATE} from '../../constants';
import {get} from 'lodash';
import './style.scss';

function EventsAdvancedSearchFormComponent({
    handleSubmit,
    pristine,
    reset,
    submitting,
    error,
    resetSearch,
    existingLocationSearchResults,
}) {
    return (
        <form onSubmit={handleSubmit} className="EventsAdvancedSearchForm">
            <fieldset>
                <Field name="name"
                    component={fields.InputField}
                    type="text"
                    label="Name"/>
                <Field name="source"
                    component={fields.IngestProviderField}
                    type="text"
                    label="Ingest Source"/>
                <Field name="location"
                    component={fields.GeoLookupInput}
                    type="text"
                    label="Location"
                    localSearchResults={existingLocationSearchResults}
                    disableSearch={true} />
                <Field name="calendars"
                    component={fields.EventCalendarField}
                    label="Calendars"/>
                <Field name="anpa_category"
                    component={fields.CategoryField}
                    label="Category"/>
                <Field name="subject"
                    component={fields.SubjectField}
                    label="Subject"/>
                <Field name="state"
                    component={fields.SpikeStateField}
                    label="Event State"/>
                <br/>&nbsp;From&nbsp;<br/>
                <Field name="dates.start"
                    component={fields.DayPickerInput}
                    withTime={true}/>
                <br/>&nbsp;To&nbsp;<br/>
                <Field name="dates.end"
                    component={fields.DayPickerInput}
                    withTime={true}/>
            </fieldset>
            <button
                className="btn btn-default"
                type="submit"
                disabled={pristine || submitting}>Submit</button>
            &nbsp;
            <button
                className="btn btn-default"
                onClick={() => {
                    reset(); resetSearch();
                }}
                type="button"
                name="clear"
                disabled={pristine || submitting}>Clear</button>
            {error && <div><strong>{error}</strong></div>}
        </form>
    );
}

EventsAdvancedSearchFormComponent.propTypes = propTypes;

// Decorate the form component
const FormComponent = reduxForm({
    form: 'eventAdvancedSearch', // a unique name for this form
    enableReinitialize: true, // the form will reinitialize every time the initialValues prop changes
    destroyOnUnmount: false,
})(EventsAdvancedSearchFormComponent);

const selector = formValueSelector('eventAdvancedSearch'); // same as form name
const mapStateToProps = (state) => ({
    startingDate: selector(state, 'dates.start'),
    endingDate: selector(state, 'dates.end'),
    existingLocationSearchResults: selector(state, '_locationSearchResults'),
});

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (form) => (
        dispatch(actions.fetchEvents({
            advancedSearch: form,
            spikeState: get(form, 'state.value', SPIKED_STATE.NOT_SPIKED),
        }))
    ),
    resetSearch: () => (dispatch(actions.fetchEvents())),
});

export const EventsAdvancedSearchForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(FormComponent);
