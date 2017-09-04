/* eslint-disable react/no-multi-comp */
import React from 'react'
import { fields } from '../index'
import { Field, FieldArray } from 'redux-form'

const renderSlugline = (readOnly) => (
    <div className="form__row">
        <Field name="slugline"
            component={fields.InputField}
            type="text"
            label="Slugline"
            readOnly={readOnly}/>
    </div>
)

const renderName = (readOnly) => (
    <div className="form__row">
        <Field name="name"
            component={fields.InputField}
            type="text"
            label="Name"
            required={true}
            readOnly={readOnly}/>
    </div>
)

const renderCalender = (readOnly) => (
    <div className="form__row">
        <Field name="calendars"
            component={fields.EventCalendarField}
            label="Calendars"
            readOnly={readOnly}/>
    </div>
)

const renderCategory = (readOnly) => (
    <div className="form__row">
        <Field name="anpa_category"
            component={fields.CategoryField}
            label="Category"
            readOnly={readOnly}/>
    </div>
)

const renderSubject = (readOnly) => (
    <div className="form__row">
        <Field name="subject"
            component={fields.SubjectField}
            label="Subject"
            readOnly={readOnly}/>
    </div>
)

const renderDescription = (readOnly) => (
    <div className="form__row">
        <Field name='definition_short'
            component={fields.InputField}
            type="text"
            label="Description"
            readOnly={readOnly}/>
    </div>
)

const renderLongDescription = (readOnly) => (
    <div className="form__row">
        <Field name="definition_long"
            component={fields.InputTextAreaField}
            label="Long Description"
            readOnly={readOnly}/>
    </div>
)

const renderInternalNote = (readOnly) => (
    <div className="form__row">
        <Field name="internal_note"
            component={fields.InputTextAreaField}
            label="Internal Note"
            readOnly={readOnly}/>
    </div>
)

const renderLocation = (readOnly) => (
    <div className="form__row">
        <Field name="location[0]"
            component={fields.GeoLookupInput}
            label="Location"
            readOnly={readOnly}/>
    </div>
)

const renderDate = (readOnly, start=false, occurrenceOverlaps=null, defaultDate=null) => {
    const name = start ? 'dates.start' : 'dates.end'
    const label = start  ? 'From' : 'To'
    return <Field name={name}
               component={fields.DayPickerInput}
               label={label}
               withTime={true}
               defaultDate={defaultDate}
               occurrenceOverlaps={occurrenceOverlaps}
               readOnly={readOnly}/>
}

const renderOccurStatus = (readOnly) => (
    <div className="form__row">
        <Field name="occur_status"
            component={fields.OccurStatusField}
            label="Occurence Status"
            readOnly={readOnly}/>
    </div>
)

const renderLinks = (readOnly) => (
    <div className="form__row">
        <FieldArray name="links" component={fields.LinksFieldArray} readOnly={readOnly} />
    </div>
)

const renderFiles = (readOnly) => (
    <div className="form__row">
        <FieldArray name="files" component={fields.FilesFieldArray} readOnly={readOnly}/>
    </div>
)

export const fieldRenders = {
    renderSlugline,
    renderName,
    renderCalender,
    renderCategory,
    renderSubject,
    renderDescription,
    renderLongDescription,
    renderInternalNote,
    renderLocation,
    renderDate,
    renderOccurStatus,
    renderLinks,
    renderFiles,
}
