import * as React from 'react';
import {AddGeoLookupInput} from './AddGeoLookupInput';

import {LineInput, Label} from '../UI/Form';
import {ILocation} from '../../interfaces';

interface IProps {
    field: string;
    label?: string;
    value?: ILocation;
    disableSearch?: boolean;
    hint?: string;
    message?: string;
    required?: boolean;
    invalid?: boolean;
    readOnly?: boolean;
    boxed?: boolean;
    noMargin?: boolean;
    onChange(field: string, value?: Partial<ILocation>): void;
    onFocus?(): void;
    popupContainer?(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}

export class GeoLookupInput extends React.PureComponent<IProps> {
    render() {
        const {
            label,
            disableSearch,
            onChange,
            value,
            field,
            readOnly,
            onFocus,
            popupContainer,
            ...props
        } = this.props;

        return (
            <LineInput {...props} readOnly={readOnly}>
                <Label text={label} />
                <AddGeoLookupInput
                    field={field}
                    onChange={onChange}
                    initialValue={value}
                    readOnly={readOnly}
                    disableSearch={disableSearch}
                    onFocus={onFocus}
                    popupContainer={popupContainer}
                    onPopupOpen={props.onPopupOpen}
                    onPopupClose={props.onPopupClose}
                />
            </LineInput>
        );
    }
}
