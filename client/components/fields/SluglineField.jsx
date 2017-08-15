import React from 'react'
import './style.scss'
import { Field } from 'redux-form'
import { InputField } from './InputField'

export const SluglineField = ({ readOnly }) => (
    <div>
        <div>
            <label htmlFor="slugline">Slugline</label>
        </div>
        <div>
            <Field name="slugline"
                component={InputField}
                type="text"
                readOnly={readOnly}/>
        </div>
    </div>
)

SluglineField.propTypes = { readOnly: React.PropTypes.bool }
