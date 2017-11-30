import React, {PropTypes} from 'react';
import {ColoredValueSelectFieldPopup} from './ColoredValueSelectFieldPopup';
import classNames from 'classnames';
import {get} from 'lodash';

export class ColoredValueSelectField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {openPopup: false};
    }

    toggleOpenPopup() {
        this.setState({openPopup: !this.state.openPopup});
    }

    getIconClasses(val) {
        return val ? classNames('line-input',
            this.props.iconName,
            this.props.iconName + '--' + get(val, 'value.qcode', val.label)) : 'line-input';
    }

    render() {
        const {
            required,
            meta,
            input,
            value,
            label,
            readOnly,
            labelLeft,
            clearable,
        } = this.props;

        const touched = get(meta, 'touched');
        const error = get(meta, 'error');
        const warning = get(meta, 'warning');
        const showMessage = touched && (error || warning);
        const divClasses = classNames(
            'ColoredValueSelect',
            'sd-line-input',
            {'sd-line-input--label-left': labelLeft},
            {'sd-line-input--invalid': showMessage},
            {'sd-line-input--no-margin': !showMessage},
            {'sd-line-input--required': required}
        );

        return (<div className={divClasses}>
            { label && <label className="sd-line-input__label ColoredValueSelect__label" htmlFor={input.name}>
                {label}
            </label> }
            <div className="sd-line-input__input">
                <button type="button"
                    className="dropdown__toggle ColoredValueSelect__input"
                    disabled={readOnly}
                    onClick={this.toggleOpenPopup.bind(this)}>
                    <span className={this.getIconClasses(value)}>
                        {get(value, 'value.qcode', get(value, 'label', 'None'))}
                    </span>
                    &nbsp;&nbsp;{get(value, 'label')}
                    {!readOnly && <b className="dropdown__caret" />}
                </button>
                { this.state.openPopup && <ColoredValueSelectFieldPopup
                    title={label}
                    options={this.props.options}
                    getClassNamesForOption={this.getIconClasses.bind(this)}
                    onChange={(val) => {
                        this.props.input.onChange(val.value.qcode);
                        this.toggleOpenPopup();
                    }}
                    onCancel={this.toggleOpenPopup.bind(this)}
                    clearable={clearable} /> }
            </div>
            {touched && (
                (error && <div className="sd-line-input__message">{error}</div>) ||
                (warning && <div className="sd-line-input__message">{warning}</div>)
            )}
        </div>);
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
    meta: PropTypes.object,
    required: PropTypes.bool,
    labelLeft: PropTypes.bool,
    clearable: PropTypes.bool,
};

ColoredValueSelectField.defaultProps = {
    meta: {},
    required: false,
    labelLeft: false,
    clearable: true,
};
