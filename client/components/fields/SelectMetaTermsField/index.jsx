import React, { PropTypes } from 'react'
import { SelectFieldPopup } from './SelectFieldPopup'
import './style.scss'

export class SelectMetaTermsField extends React.Component {
    constructor(props) {
        super(props)
        this.state = { openSelectPopup: false }
    }

    toggleOpenSelectPopup() {
        this.setState({ openSelectPopup: !this.state.openSelectPopup })
    }

    removeValue(index) {
        const key = this.props.valueKey ? this.props.valueKey : 'label'
        let newValues = this.props.value.filter((v) => v[key] !== this.props.value[index][key])
        this.props.input.onChange(newValues.map((v) => (v.value)))
    }

    render() {
        const { touched, error, warning } = this.props.meta
        return ( <div className='field'>
            { this.props.label && <label>{this.props.label}</label> }
            { !this.props.readOnly && <button type="button" className="Select__dropdownToggle" onClick={this.toggleOpenSelectPopup.bind(this)}>
                <i className="icon--white icon-plus-large" />
            </button> }
            { this.props.value && this.props.value.length > 0 && (
                <div className="terms-list">
                    <ul>
                        {this.props.value.map((v, index) => (
                            <li key={index} className='pull-left'>
                                { !this.props.readOnly &&
                                <i className="icon-close-small" onClick={this.removeValue.bind(this, index)}/> }
                                { v.label }
                            </li>
                        ))}
                    </ul>
                </div>
            ) }
            { this.state.openSelectPopup && (<SelectFieldPopup
                options={this.props.options} value={this.props.value}
                onCancel={this.toggleOpenSelectPopup.bind(this)}
                onChange={(opt) => {
                    this.props.onChange(opt, this.props)
                    this.toggleOpenSelectPopup()

                }} />) }
            {touched && ((error && <span className="error-block">{error}</span>) ||
            (warning && <span className="help-block">{warning}</span>))}
        </div> )
    }
}

SelectMetaTermsField.propTypes = {
    meta: PropTypes.object.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.object,
    })).isRequired,
    value: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.shape(undefined),
        PropTypes.shape({
            label: PropTypes.string,
            value: PropTypes.object,
        }),
    ]),
    input: PropTypes.object,
    label: PropTypes.string,
    valueKey: PropTypes.string,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
}

SelectMetaTermsField.defaultProps = {
    onChange: function (opt, props) {
        // Check if it's duplicate
        if (props && props.value && props.value.length > 0) {
            const key = props.valueKey ? props.valueKey : 'label'
            if (props.value.find((v) => ( v[key] === opt[key] ))) {
                return
            }
            let newValues = props.value.map((v) => (v.value))
            props.input.onChange([...newValues, opt.value])
        } else {
            props.input.onChange([opt.value])
        }
    },
}
