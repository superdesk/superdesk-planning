import React from 'react';
import PropTypes from 'prop-types';
import {SelectListPopup} from './SelectListPopup';
import {differenceBy} from 'lodash';
import './style.scss';
import {LineInput, Label} from '../../UI/Form';


export class SelectSearchTermsField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            multiLevel: false,
            openSelectPopup: true,
            viewDetails: false,
            viewIndex: null
        };
        this.removeValue = this.removeValue.bind(this);
        this.toggleOpenSelectPopup = this.toggleOpenSelectPopup.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    componentWillMount() {
        // There is at least one parent or multi-level option
        this.setState({multiLevel: this.props.options.filter((o) => (o.value.parent)).length > 0});
    }

    toggleOpenSelectPopup() {
        this.setState({openSelectPopup: !this.state.openSelectPopup});
    }

    removeValue(index) {
        const {value, field, onChange} = this.props;

        value.splice(index, 1);
        let newValues = value.map((v) => (v.value));

        onChange(field, [...newValues]);
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
            return differenceBy(this.props.options, this.props.value, this.props.valueKey);
        } else {
            return this.props.options;
        }
    }

    onChange(opt) {
        const {value, valueKey, onChange, field} = this.props;

        // Check if it's duplicate
        if (value && value.length > 0) {
            if (value.find((v) => (v[valueKey] === opt[valueKey]))) {
                return;
            }

            let newValues = value.map((v) => (v.value));

            onChange(field, [...newValues, opt.value]);
        } else {
            onChange(field, [opt.value]);
        }
    }

    render() {
        const {label, value, valueKey, ...props} = this.props;
        const options = this.removeValuesFromOptions();

        return (
            <LineInput {...props}>
                <Label text={label} />
                <SelectListPopup
                    value={value}
                    multiLevel={this.state.multiLevel}
                    valueKey={valueKey}
                    options={options}
                    onCancel={this.toggleOpenSelectPopup}
                    onChange={(opt) => {
                        this.onChange(opt);
                        this.toggleOpenSelectPopup();
                    }}
                    target="sd-line-input__input" />

                <div>
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
                                            {(<div className="sd-list-item__action-menu
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
            </LineInput>
        );
    }
}

SelectSearchTermsField.propTypes = {
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
    label: PropTypes.string,
    valueKey: PropTypes.string,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    required: PropTypes.bool,
    onClose: PropTypes.func,
    field: PropTypes.string.isRequired,
};

SelectSearchTermsField.defaultProps = {
    required: false,
    valueKey: 'label',
};

