import React from 'react';
import PropTypes from 'prop-types';
import {SelectListPopup} from './SelectListPopup';
import {differenceBy} from 'lodash';
import {LineInput, Label} from '../../UI/Form';
import {KEYCODES} from '../../../constants';
import {onEventCapture} from '../../../utils';
import {List} from '../../UI';
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
        const {label, value, valueKey, querySearch, onQuerySearch, onAdd, onAddText, ...props} = this.props;
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
                    target="sd-line-input__input"
                    querySearch={querySearch}
                    onQuerySearch={onQuerySearch}
                    onAdd={onAdd}
                    onAddText={onAddText} />

                <div>
                    { value && value.length > 0 && (
                        <div>
                            {this.state.viewDetails && (
                                this.props.value[this.state.viewIndex].onViewDetails(this.closeDetails.bind(this))
                            )}
                            <div>
                                {value.map((v, index) => (
                                    <List.Item shadow={2} key={index} margin={true}
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.keyCode === KEYCODES.ENTER &&
                                                !this.state.viewDetails) {
                                                onEventCapture(event);
                                                this.viewDetails(index);
                                            }
                                        }
                                        } >
                                        <List.Column grow={true} border={false}>
                                            <List.Row>
                                                { v.label }
                                            </List.Row>
                                        </List.Column>
                                        <List.ActionMenu>
                                            <span data-sd-tooltip="View Details"
                                                data-flow="left" onClick={this.viewDetails.bind(this, index)}>
                                                <i className="icon-external" />
                                            </span>
                                            <span className="icn-btn" data-sd-tooltip="Remove"
                                                data-flow="left" onClick={this.removeValue.bind(this, index)}>
                                                <i className="icon-trash" />
                                            </span>
                                        </List.ActionMenu>
                                    </List.Item>
                                ))}
                            </div>
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
    querySearch: PropTypes.bool,
    onQuerySearch: PropTypes.func,
    onAdd: PropTypes.func,
    onAddText: PropTypes.string,
};

SelectSearchTermsField.defaultProps = {
    required: false,
    valueKey: 'label',
    querySearch: false,
};
