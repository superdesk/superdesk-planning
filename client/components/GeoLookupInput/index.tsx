import * as React from 'react';
import {AddGeoLookupInput} from './AddGeoLookupInput';

import {LineInput, Label} from '../UI/Form';
import {ILocation} from '../../interfaces';
import {showModal} from '@sourcefabric/common';
import {CreateNewGeoLookup} from './CreateNewGeoLookup';
import {Provider} from 'react-redux';
import {planningApi} from '../../superdeskApi';

interface IProps {
    field: string;
    label?: string;
    value?: ILocation;
    disableSearch?: boolean;
    disableAddLocation?: boolean;
    hint?: string;
    message?: string;
    required?: boolean;
    invalid?: boolean;
    readOnly?: boolean;
    boxed?: boolean;
    noMargin?: boolean;
    refNode?: React.RefObject<any>;
    language?: string;
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
            disableAddLocation,
            onChange,
            value,
            field,
            readOnly,
            language,
            onFocus,
            popupContainer,
            refNode,
            ...props
        } = this.props;

        return (
            <LineInput
                {...props}
                readOnly={readOnly}
                className="addgeolookup2"
                noMargin={true}
            >
                <Label text={label} />
                <AddGeoLookupInput
                    ref={refNode}
                    field={field}
                    onChange={onChange}
                    initialValue={value}
                    readOnly={readOnly}
                    language={language}
                    disableSearch={disableSearch}
                    disableAddLocation={disableAddLocation ?? true}
                    onFocus={onFocus}
                    popupContainer={popupContainer}
                    onPopupOpen={props.onPopupOpen}
                    onPopupClose={props.onPopupClose}
                    showAddLocationForm={(props) => {
                        let newLocation: ILocation;

                        return showModal(({closeModal}) => (
                            <Provider store={planningApi.redux.store}>
                                <CreateNewGeoLookup
                                    {...props}
                                    onError={() => {
                                        closeModal();
                                    }}
                                    onSuccess={(location) => {
                                        newLocation = location;
                                        closeModal();
                                    }}
                                />
                            </Provider>
                        )).then(() => newLocation);
                    }}
                />
            </LineInput>
        );
    }
}
