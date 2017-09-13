import React, { PropTypes } from 'react'
import { SelectFieldPopup } from './SelectFieldPopup'
import classNames from 'classnames'
import { differenceBy } from 'lodash'
import './style.scss'

export class SelectMetaTermsField extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            multiLevel: false,
            openSelectPopup: false,
        }
    }

    componentWillMount() {
        // There is at least one parent or multi-level option
        this.setState({ multiLevel: this.props.options.filter((o) => (o.value.parent)).length > 0 })
    }

    toggleOpenSelectPopup() {
        this.setState({ openSelectPopup: !this.state.openSelectPopup })
    }

    removeValue(index) {
        const key = this.props.valueKey ? this.props.valueKey : 'label'
        let newValues = this.props.value.filter((v) => v[key] !== this.props.value[index][key])
        this.props.input.onChange(newValues.map((v) => (v.value)))
    }

    removeValuesFromOptions() {
        if (!this.state.multiLevel) {
            const key = this.props.valueKey ? this.props.valueKey : 'label'
            return differenceBy(this.props.options, this.props.value, key)
        } else {
            return this.props.options
        }
    }

    render() {
        const { required, readOnly, label, value, onChange, labelLeft } = this.props
        const { touched, error, warning } = this.props.meta

        const showMessage = touched && (error || warning)
        const divClass = classNames(
            'sd-line-input',
            { 'sd-line-input--label-left': labelLeft },
            { 'sd-line-input--invalid': showMessage },
            { 'sd-line-input--no-margin': !showMessage },
            { 'sd-line-input--required': required }
        )

        const inputClass = classNames(
            'sd-line-input__input',
            { 'sd-line-input--disabled': readOnly }
        )

        return <div className={divClass}>
            { label &&
                <label className='sd-line-input__label'>
                    {label}
                </label>
            }

            <div className={inputClass}>
                { !readOnly && <button type="button" className="Select__dropdownToggle" onClick={this.toggleOpenSelectPopup.bind(this)}>
                    <i className="icon--white icon-plus-large" />
                </button> }
                { value && value.length > 0 && (
                    <div className="terms-list">
                        <ul>
                            {value.map((v, index) => (
                                <li key={index} className='pull-left'>
                                    { !readOnly &&
                                    <i className="icon-close-small" onClick={this.removeValue.bind(this, index)}/> }
                                    { v.label }
                                </li>
                            ))}
                        </ul>
                    </div>
                ) }
            </div>
            { this.state.openSelectPopup &&
                <SelectFieldPopup
                    value={value}
                    multiLevel={this.state.multiLevel}
                    options={this.removeValuesFromOptions()}
                    onCancel={this.toggleOpenSelectPopup.bind(this)}
                    onChange={(opt) => {
                        onChange(opt, this.props)
                        this.toggleOpenSelectPopup()
                    }}

                />
            }

            {touched && (
                (error && <div className='sd-line-input__message'>{error}</div>) ||
                (warning && <div className='sd-line-input__message'>{warning}</div>)
            )}
        </div>
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
    required: PropTypes.bool,
    labelLeft: PropTypes.bool,
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
    required: false,
    labelLeft: true,
}
