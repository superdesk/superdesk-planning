import React, { PropTypes } from 'react'
import { ColoredValueSelectFieldPopup } from './ColoredValueSelectFieldPopup'
import classNames from 'classnames'
import { get } from 'lodash'

export class ColoredValueSelectField extends React.Component {
    constructor(props) {
        super(props)
        this.state = { openPopup: false }
    }

    toggleOpenPopup() {
        this.setState({ openPopup: !this.state.openPopup })
    }

    getIconClasses(val) {
        return val ? classNames('line-input',
            this.props.iconName,
            this.props.iconName + '--' + val.label) : 'line-input'
    }

    render() {
        return ( <div className='field'>
            { this.props.label && <label>{this.props.label}</label> }
            <button type="button"
                className='dropdown__toggle'
                disabled={this.props.readOnly}
                onClick={this.toggleOpenPopup.bind(this)}>
                <span className={this.getIconClasses(this.props.value)}>
                    {this.props.value ? this.props.value.label : 'None'}
                </span>
                &nbsp;&nbsp;{get(this.props.value, 'label')}
                {!this.props.readOnly && <b className='dropdown__caret' />}
            </button>
            { this.state.openPopup && <ColoredValueSelectFieldPopup
                title={this.props.label}
                options={this.props.options}
                getClassNamesForOption={this.getIconClasses.bind(this)}
                onChange={(val) => {
                    this.props.input.onChange(val.value.qcode)
                    this.toggleOpenPopup()
                }}
                onCancel={this.toggleOpenPopup.bind(this)} /> }
        </div> )
    }
}

ColoredValueSelectField.propTypes = {
    options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.object,
    })).isRequired,
    input: PropTypes.object,
    value: PropTypes.object,
    label: PropTypes.string,
    readOnly: PropTypes.bool,
    iconName: PropTypes.string.isRequired,
}
