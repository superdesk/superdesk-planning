/* eslint-disable react/no-multi-comp */
import React from 'react'
import { fields } from '../index'
import { Field, FieldArray } from 'redux-form'

const renderSlugline = (readOnly) => (
    <div>
        <div>
            <label htmlFor="slugline">Slugline</label>
        </div>
        <div>
            <Field name="slugline"
                component={fields.InputField}
                type="text"
                readOnly={readOnly}/>
        </div>
    </div>
)

const renderName = (readOnly) => (
    <div>
        <div>
            <label htmlFor="name">Name</label>
        </div>
        <div>
            <Field name="name"
                component={fields.InputField}
                type="text"
                readOnly={readOnly}/>
        </div>
    </div>
)

const renderCalender = (readOnly) => (
    <div>
        <Field name="calendars"
               component={fields.EventCalendarField}
               label="Calendars"
               readOnly={readOnly}/>
    </div>
)

const renderCategory = (readOnly) => (
    <div>
        <Field name="anpa_category"
            component={fields.CategoryField}
            label="Category"
            readOnly={readOnly}/>
    </div>
)


const renderSubject = (readOnly) => (
    <div>
        <Field name="subject"
            component={fields.SubjectField}
            label="Subject"
            readOnly={readOnly}/>
    </div>
)

const renderDescription = (readOnly) => (
    <div>
        <Field name='description_text'
            component={fields.InputField}
            type="text"
            label="Short Description"
            readOnly={readOnly}/>
    </div>
)

const renderLongDescription = (readOnly) => (
    <div>
        <Field name="definition_long"
            component={fields.InputTextAreaField}
            multiLine={true}
            label="Description"
            readOnly={readOnly}/>
    </div>
)

const renderInternalNote = (readOnly) => (
    <div>
        <Field name="internal_note"
            component={fields.InputTextAreaField}
            label="Internal Note"
            readOnly={readOnly}/>
    </div>
)

const renderLocation = (readOnly) => (
    <div>
        <Field name="location[0]"
            component={fields.GeoLookupInput}
            label="Location"
            readOnly={readOnly}/>
    </div>
)

const renderDate = (readOnly, start=false, occurrenceOverlaps=null) => {
    const name = start ? 'dates.start' : 'dates.end'
    const label = start  ? 'From' : 'To'
    return (<div>
        <div>
            <label htmlFor={name}>{label}</label>
        </div>
        <div>
            <Field name={name}
                   component={fields.DayPickerInput}
                   withTime={true}
                   readOnly={readOnly}/>&nbsp;
            { start && occurrenceOverlaps && (
                <span className="error-block">Events Overlap!</span>
            )}
        </div>
    </div>)
}

const renderOccurStatus = (readOnly) => (
    <div>
        <Field name="occur_status"
            component={fields.OccurStatusField}
            label="Event Occurence Status"
            readOnly={readOnly}/>
    </div>
)

const renderLinks = (readOnly) => (
    <div>
        <label htmlFor="links">External links</label>
        <FieldArray name="links" component={fields.LinksFieldArray} readOnly={readOnly} />
    </div>
)

const renderFiles = (readOnly) => (
    <div>
        <label htmlFor="files">Attached files</label>
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
