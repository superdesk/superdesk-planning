import React from 'react';
import {SelectListPopup} from './SelectListPopup';
import {LineInput, Label} from '../../UI/Form';

import './style.scss';

interface IProps {
    value: Array<string>;
    label?: string;
    readOnly?: boolean;
    onChange: (field: string, value: any) => void;
    required?: boolean;
    onAdd?: (...args: any) => void;
    onAddText?: string;
    onFocus?: (...args: any) => void;
    contactType?: string;
    minLengthPopup?: number;
    placeholder?: string;
}

export class SelectSearchContactsField extends React.Component<IProps, {openSelectPopup: boolean}> {
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
            minLengthPopup = 1,
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
