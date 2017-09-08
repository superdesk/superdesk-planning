/* eslint-disable react/no-multi-comp, react/prop-types */
import React from 'react'
import { fields } from '../index'
import { Field, FieldArray } from 'redux-form'


const renderSlugline = (props) => (
    <div className="form__row">
        <Field name="slugline"
            component={fields.InputField}
            type="text"
            label="Slugline"
            required={props.fieldSchema.required}
            readOnly={props.readOnly} />
    </div>
)

const renderName = (props) => (
    <div className="form__row">
        <Field name="name"
            component={fields.InputField}
            type="text"
            label="Name"
            required={props.fieldSchema.required}
            readOnly={props.readOnly} />
    </div>
)

const renderCalender = (props) => (
    <div className="form__row">
        <Field name="calendars"
            component={fields.EventCalendarField}
            label="Calendars"
            required={props.fieldSchema.required}
            readOnly={props.readOnly} />
    </div>
)

const renderCategory = (props) => (
    <div className="form__row">
        <Field name="anpa_category"
            component={fields.CategoryField}
            label="Category"
            required={props.fieldSchema.required}
            readOnly={props.readOnly} />
    </div>
)

const renderSubject = (props) => (
    <div className="form__row">
        <Field name="subject"
            component={fields.SubjectField}
            label="Subject"
            required={props.fieldSchema.required}
            readOnly={props.readOnly} />
    </div>
)

const renderDescription = (props) => (
    <div className="form__row">
        <Field name='definition_short'
            component={fields.InputField}
            type="text"
            label="Description"
            required={props.fieldSchema.required}
            readOnly={props.readOnly}/>
    </div>
)

const renderLongDescription = (props) => (
    <div className="form__row">
        <Field name="definition_long"
            component={fields.InputTextAreaField}
            label="Long Description"
            required={props.fieldSchema.required}
            readOnly={props.readOnly} />
    </div>
)

const renderInternalNote = (props) => (
    <div className="form__row">
        <Field name="internal_note"
            component={fields.InputTextAreaField}
            label="Internal Note"
            required={props.fieldSchema.required}
            readOnly={props.readOnly} />
    </div>
)

const renderLocation = (props) => (
    <div className="form__row">
        <Field name="location[0]"
            component={fields.GeoLookupInput}
            label="Location"
            required={props.fieldSchema.required}
            readOnly={props.readOnly} />
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
               required={true}
               readOnly={readOnly}/>
}

const renderOccurStatus = (props) => (
    <div className="form__row">
        <Field name="occur_status"
            component={fields.OccurStatusField}
            label="Occurence Status"
            required={props.fieldSchema.required}
            readOnly={props.readOnly} />
    </div>
)

const renderLinks = (props) => (
    <div className="form__row">
        <FieldArray name="links"
            component={fields.LinksFieldArray}
            required={props.fieldSchema.required}
            readOnly={props.readOnly} />
    </div>
)

const renderFiles = (props) => (
    <div className="form__row">
        <FieldArray name="files"
            component={fields.FilesFieldArray}
            required={props.fieldSchema.required}
            readOnly={props.readOnly}/>
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
