import React from 'react'
import { Field } from 'redux-form'
import { InputTextAreaField } from './InputTextAreaField'

export const InternalNoteField = ({ readOnly }) => (
    <div>
        <Field name="internal_note"
            component={InputTextAreaField}
            label="Internal Note"
            readOnly={readOnly}/>
    </div>
)

InternalNoteField.propTypes = { readOnly: React.PropTypes.bool }
