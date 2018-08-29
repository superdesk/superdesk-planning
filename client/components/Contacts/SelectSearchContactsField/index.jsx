import React from 'react';
import PropTypes from 'prop-types';
import {differenceBy} from 'lodash';
import {SelectListPopup} from './SelectListPopup';
import {LineInput, Label} from '../../UI/Form';
import {ContactMetaData} from '../index';

import './style.scss';


export class SelectSearchContactsField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            openSelectPopup: true,
            editDetails: false,
            viewIndex: null,
        };
        this.removeValue = this.removeValue.bind(this);
        this.toggleOpenSelectPopup = this.toggleOpenSelectPopup.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    toggleOpenSelectPopup() {
        this.setState({openSelectPopup: !this.state.openSelectPopup});
    }

    removeValue(index) {
        const {value, valueKey, field, onChange} = this.props;

        value.splice(index, 1);
        let newValues = value.map((v) => (v.value[valueKey]));

        onChange(field, [...newValues]);
    }

    editDetails(index) {
        this.setState({
            editDetails: true,
            viewIndex: index,
        });
    }

    // Set to close details
    closeDetails() {
        this.setState({
            editDetails: false,
        });
    }

    removeValuesFromOptions() {
        return differenceBy(this.props.options, this.props.value, `value[${this.props.valueKey}]`);
    }

    onChange(opt) {
        const {value, valueKey, onChange, field} = this.props;

        // Check if it's duplicate
        if (value && value.length > 0) {
            if (value.find((v) => (v.value[valueKey] === opt.value[valueKey]))) {
                return;
            }

            let newValues = value.map((v) => (v.value[valueKey]));

            onChange(field, [...newValues, opt.value[valueKey]]);
        } else {
            onChange(field, [opt.value[valueKey]]);
        }
    }

    render() {
        const {label, value, valueKey, querySearch, onQuerySearch, onAdd, onAddText, onFocus, ...props} = this.props;
        const options = this.removeValuesFromOptions();

        return (
            <LineInput {...props}>
                <Label text={label} />
                <SelectListPopup
                    value={value}
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
                    onAddText={onAddText}
                    onFocus={onFocus}
                    readOnly={this.props.readOnly} />

                <div>
                    {this.state.editDetails && (
                        this.props.value[this.state.viewIndex].onEditDetails(this.closeDetails.bind(this))
                    )}
                    {value && value.length > 0 && (
                        <div>
                            {value.map((v, index) => (
                                <ContactMetaData
                                    key={index}
                                    contact={v}
                                    onEditContact={onAdd && this.editDetails.bind(this, index) || null}
                                    onRemoveContact={onAdd && this.removeValue.bind(this, index) || null}
                                    scrollInView={true}
                                    scrollIntoViewOptions={{block: 'center'}}
                                    tabEnabled />
                            ))}
                        </div>
                    )}
                </div>
            </LineInput>
        );
    }
}

SelectSearchContactsField.propTypes = {
    options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.string,
        ]),
        value: PropTypes.oneOfType([
            PropTypes.object,
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
            ]),
            onEditDetails: PropTypes.func,
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
    onFocus: PropTypes.func,
};

SelectSearchContactsField.defaultProps = {
    required: false,
    valueKey: '_id',
    querySearch: false,
};
