import React from 'react'
import { InputField, DayPickerInput } from './index'
import { Field } from 'redux-form'

export class Coverage extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <fieldset className="Coverage">
                <Field
                    name={`${this.props.coverage}.planning.ednote`}
                    component={InputField}
                    type="text"
                    label="Description"/>
                <Field
                    name={`${this.props.coverage}.planning.g2_content_type`}
                    component="select">
                    <option></option>
                    <option value="text">Story</option>
                    <option value="picture">Picture</option>
                </Field>
                <label>Due</label>
                <Field
                    name={`${this.props.coverage}.planning.scheduled`}
                    component={DayPickerInput}
                    withTime={true} />
            </fieldset>
        )
    }
}
