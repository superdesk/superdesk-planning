import React from 'react';
import PropTypes from 'prop-types';
import {SelectListPopup} from './SelectListPopup';
import {LineInput, Label} from '../../UI/Form';

import './style.scss';


export class SelectSearchContactsField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {openSelectPopup: true};

        this.toggleOpenSelectPopup = this.toggleOpenSelectPopup.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    toggleOpenSelectPopup() {
        this.setState({openSelectPopup: !this.state.openSelectPopup});
    }

    onChange(contact) {
        this.props.onChange(contact);
        this.toggleOpenSelectPopup();
    }

    render() {
        const {
            label,
            value,
            onAdd,
            onAddText,
            onFocus,
            readOnly,
            contactType,
            minLengthPopup,
            placeholder,
            ...props
        } = this.props;

        return (
            <LineInput readOnly={readOnly} {...props}>
                {label && (
                    <Label text={label} />
                )}
                <SelectListPopup
                    value={value}
                    onChange={this.onChange}
                    target="sd-line-input__input"
                    onAdd={onAdd}
                    onAddText={onAddText}
                    onFocus={onFocus}
                    readOnly={readOnly}
                    onPopupOpen={props.onPopupOpen}
                    onPopupClose={props.onPopupClose}
                    contactType={contactType}
                    minLength={minLengthPopup}
                    placeholder={placeholder}
                />
            </LineInput>
        );
    }
}

SelectSearchContactsField.propTypes = {
    value: PropTypes.arrayOf(PropTypes.string),
    label: PropTypes.string,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    required: PropTypes.bool,
    field: PropTypes.string.isRequired,
    onAdd: PropTypes.func,
    onAddText: PropTypes.string,
    onFocus: PropTypes.func,
    contactType: PropTypes.string,
    minLengthPopup: PropTypes.number,
    placeholder: PropTypes.string,
};

SelectSearchContactsField.defaultProps = {
    required: false,
    readOnly: false,
    minLengthPopup: 1,
};
