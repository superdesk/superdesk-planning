import React from 'react'
import { SelectField } from './SelectField'

export const DeskSelectField = (props) => {
    const ownProps = {
        ...props,
        multi: false,
        clearable: false,
        options: props.desks.map((desk) => (
            {
                label: desk.name,
                value: desk,
            }
        )),
        value: props.input && props.input.value ? {
            label: props.input.value.name,
            value: props.input.value,
        } : null,
        meta: { },
    }
    return (<SelectField {...ownProps}/>)
}

DeskSelectField.propTypes = {
    desks: React.PropTypes.array.isRequired,
    input: React.PropTypes.object.isRequired,
}
