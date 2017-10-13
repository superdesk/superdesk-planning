import React from 'react'
import { SelectField } from './SelectField'
import PropTypes from 'prop-types'

export const CoverageProviderField = (props) => {
    const ownProps = {
        ...props,
        options: (props.coverageProviders || []).map((provider) => (
            {
                key: provider.qcode,
                label: provider.name,
                value: provider.qcode,
            }
        )),

        getOptionFromValue: (value, options) => value && options.find(
            option => option.key === value.qcode
        ),

        meta: { },

        clearable: true,
    }

    return (<SelectField {...ownProps}/>)
}

CoverageProviderField.propTypes = {
    // eslint-disable-next-line react/no-unused-prop-types
    input: PropTypes.object.isRequired,
    coverageProviders: PropTypes.array.isRequired,
}
