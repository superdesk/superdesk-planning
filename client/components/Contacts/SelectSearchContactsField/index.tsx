import React from 'react';
import {SelectListPopup} from './SelectListPopup';
import {LineInput, Label} from '../../UI/Form';
import {IContact} from 'superdesk-api';
import './style.scss';

interface IProps {
    value: Array<string>;
    label?: string;
    readOnly?: boolean;
    onChange: (contact: IContact) => void;
    required?: boolean;
    message?: string;
    invalid?: boolean;
    onAdd?: (...args: any) => void;
    onAddText?: string;
    onFocus?: (...args: any) => void;
    contactType?: string;
    minLengthPopup?: number;
    placeholder?: string;
    noMargin?: boolean
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

    onChange(contact: IContact) {
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
            noMargin,
            message,
            invalid,
            ...props
        } = this.props;

        const hasLabel = (label ?? '').trim();

        return (
            <LineInput
                readOnly={readOnly}
                {...props}
                message={message}
                invalid={invalid}
                noLabel={!hasLabel}
                noMargin={noMargin}
            >
                {hasLabel && (
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
