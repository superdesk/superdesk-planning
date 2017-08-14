import React from 'react'
import { Field } from 'redux-form'
import { InputField } from './InputField'

export const DescriptionField = ({ name, label, readOnly }) => (
    <div>
        <Field name={name}
            component={InputField}
            type="text"
            label={label}
            readOnly={readOnly}/>
    </div>
)

DescriptionField.defaultProps = {
    name: 'Description',
    label: 'description_text',
}

DescriptionField.propTypes = {
    name: React.PropTypes.string,
    label: React.PropTypes.string,
    readOnly: React.PropTypes.bool,
}
