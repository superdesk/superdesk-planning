import React from 'react';
import PropTypes from 'prop-types';
import {SelectListPopup} from './SelectListPopup';
import classNames from 'classnames';
import {differenceBy} from 'lodash';
import './style.scss';

export class SelectSearchTermsField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            multiLevel: false,
            openSelectPopup: true,
            viewDetails: false,
            viewIndex: null
        };
    }

    componentWillMount() {
        // There is at least one parent or multi-level option
        this.setState({multiLevel: this.props.options.filter((o) => (o.value.parent)).length > 0});
    }

    toggleOpenSelectPopup() {
        this.setState({openSelectPopup: !this.state.openSelectPopup});
    }

    removeValue(index) {
        const key = this.props.valueKey ? this.props.valueKey : 'label';
        let newValues = this.props.value.filter((v) => v[key] !== this.props.value[index][key]);

        this.props.input.onChange(newValues.map((v) => (v.value)));
    }

    // Set to trigger onViewDetails function for displaying details
    viewDetails(index) {
        this.setState({
            viewDetails: true,
            viewIndex: index
        });
    }

    // Set to close details
    closeDetails() {
        this.setState({
            viewDetails: false
        });
    }

    removeValuesFromOptions() {
        if (!this.state.multiLevel) {
            const key = this.props.valueKey ? this.props.valueKey : 'label';

            return differenceBy(this.props.options, this.props.value, key);
        } else {
            return this.props.options;
        }
    }

    render() {
        const {required, readOnly, label, value, onChange, labelLeft} = this.props;
        const {touched, error, warning} = this.props.meta;

        const showMessage = touched && (error || warning);
        const divClass = classNames(
            'sd-line-input',
            {'sd-line-input--label-left': labelLeft},
            {'sd-line-input--invalid': showMessage},
            {'sd-line-input--no-margin': !showMessage},
            {'sd-line-input--required': required}
        );

        const inputClass = classNames(
            'sd-line-input__input',
            {'sd-line-input--disabled': readOnly}
        );

        return <div className={divClass}>
            { label &&
                <label className="sd-line-input__label">
                    {label}
                </label>
            }

            <SelectListPopup
                value={value}
                multiLevel={this.state.multiLevel}
                valueKey={this.props.valueKey}
                options={this.removeValuesFromOptions()}
                onCancel={this.toggleOpenSelectPopup.bind(this)}
                onChange={(opt) => {
                    onChange(opt, this.props);
                    this.toggleOpenSelectPopup();
                }} />

            <div className={inputClass}>
                { value && value.length > 0 && (
                    <div>
                        {this.state.viewDetails && (
                            this.props.value[this.state.viewIndex].onViewDetails(this.closeDetails.bind(this))
                        )}
                        <ul className="list-items">
                            {value.map((v, index) => (
                                <li key={index}>
                                    <div className="sd-list-item sd-shadow--z2">
                                        <div className="sd-list-item__border" />
                                        <div className="sd-list-item__column sd-list-item__column--grow
                                            sd-list-item__column--no-border">
                                            <div className="sd-list-item__row">
                                                { v.label }
                                            </div>
                                        </div>
                                        { !readOnly && (<div className="sd-list-item__action-menu
                                            sd-list-item__action-menu--direction-row">
                                            <button className="dropdown__toggle" data-sd-tooltip="View Details"
                                                data-flow="left" onClick={this.viewDetails.bind(this, index)}>
                                                <i className="icon-external" />
                                            </button>
                                            <button className="dropdown__toggle" data-sd-tooltip="Remove"
                                                data-flow="left" onClick={this.removeValue.bind(this, index)}>
                                                <i className="icon-trash" />
                                            </button>
                                        </div>)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) }
            </div>

            {touched && (
                (error && <div className="sd-line-input__message">{error}</div>) ||
                (warning && <div className="sd-line-input__message">{warning}</div>)
            )}
        </div>;
    }
}

SelectSearchTermsField.propTypes = {
    meta: PropTypes.object.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.string,
        ]),
        value: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.string,
        ]),
    })).isRequired,
    value: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.shape(undefined),
        PropTypes.shape({
            label: PropTypes.oneOfType([
                PropTypes.object,
                PropTypes.string,
            ]),
            value: PropTypes.oneOfType([
                PropTypes.object,
                PropTypes.string,
            ]),
            onViewDetails: PropTypes.func,
        }),
    ]),
    input: PropTypes.object,
    label: PropTypes.string,
    valueKey: PropTypes.string,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    required: PropTypes.bool,
    labelLeft: PropTypes.bool,
    onClose: PropTypes.func,
};

SelectSearchTermsField.defaultProps = {
    onChange: function(opt, props) {
        // Check if it's duplicate
        if (props && props.value && props.value.length > 0) {
            const key = props.valueKey ? props.valueKey : 'label';

            if (props.value.find((v) => (v[key] === opt[key]))) {
                return;
            }
            let newValues = props.value.map((v) => (v.value));

            props.input.onChange([...newValues, opt.value]);
        } else {
            props.input.onChange([opt.value]);
        }
    },
    required: false,
    labelLeft: false,
};
