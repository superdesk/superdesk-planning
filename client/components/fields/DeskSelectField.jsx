import React from 'react'
import PropTypes from 'prop-types'
import { SelectField } from './SelectField'

export const DeskSelectField = (props) => {
    const ownProps = {
        ...props,
        options: props.desks.map((desk) => (
            {
                key: desk.name,
                label: desk.name,
                value: desk,
            }
        )),

        getOptionFromValue: (value, options) => value && options.find(
            option => option.key === value.name
        ),

        meta: { },

        clearable: true,
    }
    return (<SelectField {...ownProps}/>)
}

DeskSelectField.propTypes = {
    desks: PropTypes.array.isRequired,
    // eslint-disable-next-line react/no-unused-prop-types
    input: PropTypes.object.isRequired,
    autoFocus: PropTypes.bool,
}
