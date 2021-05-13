import * as React from 'react';
import {set, cloneDeep} from 'lodash';

import {IVocabularyItem} from 'superdesk-api';
import {ILocation} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';

import {formatLocationToAddress} from '../../utils/locations';

import {ButtonList} from '../UI';
import {Field, TextInput, SelectInputWithFreeText, TextAreaInput} from '../UI/Form';
import {Popup, Content, Footer, Header} from '../UI/Popup';

import './style.scss';

interface IProps {
    initialName?: string;
    target: string;
    regions: Array<IVocabularyItem>;
    countries: Array<IVocabularyItem>;
    defaultCountry?: IVocabularyItem['name'];
    initialAddressIsName?: boolean;
    onCancel(): void;
    onSave(location: Partial<ILocation>): void;
    popupContainer?(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}

interface IState {
    formInvalid: boolean;
    item: {
        location: Partial<ILocation>;
        state?: IVocabularyItem | string;
        country?: IVocabularyItem | string;
    };
}

export class CreateNewGeoLookup extends React.Component<IProps, IState> {
    dom: {
        name: React.RefObject<HTMLInputElement>;
    };

    constructor(props) {
        super(props);
        this.state = {
            formInvalid: true,
            item: {
                location: {
                    name: this.props.initialName,
                    address: {
                        line: [
                            this.props.initialAddressIsName ?
                                this.props.initialName :
                                ''
                        ],
                        country: this.props.defaultCountry ?? '',
                    },
                },
            },
        };
        this.dom = {name: React.createRef<HTMLInputElement>()};

        this.onChange = this.onChange.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onCancel = this.onCancel.bind(this);
    }

    componentDidMount() {
        if (this.dom.name.current != null) {
            this.dom.name.current.focus();
        }
    }

    getLocationFromState(item: IState['item']): Partial<ILocation> {
        const location = cloneDeep(item.location);
        const formattedAddress = formatLocationToAddress(location);

        location.unique_name = location.name.concat(' ', formattedAddress);
        location.address.state = typeof item.state === 'string' ?
            item.state :
            item.state?.name;
        location.address.country = typeof item.country === 'string' ?
            item.country :
            item.country?.name;

        return location;
    }

    onChange(field: string, value: string) {
        const item: IState['item'] = cloneDeep(this.state.item);

        set(item, field, value);

        this.setState({
            formInvalid: !item.location.name?.length ||
                !item.location.address.line?.[0]?.length ||
                !item.location.address.city?.length ||
                !item.country,
            item: item,
        });
    }

    onSave() {
        this.props.onSave(this.getLocationFromState(this.state.item));
        this.onCancel();
    }

    onCancel() {
        this.props.onCancel();
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const buttons = [{
            type: 'button',
            onClick: this.onCancel,
            text: gettext('Cancel'),
        },
        {
            color: 'primary',
            type: 'submit',
            onClick: this.onSave,
            text: gettext('Save'),
            disabled: this.state.formInvalid,
        },
        ];
        const item = this.state.item;

        return (
            <Popup
                close={this.props.onCancel}
                target={this.props.target}
                noPadding={true}
                inheritWidth={true}
                className="addgeolookup__popup-create"
                popupContainer={this.props.popupContainer}
                onPopupOpen={this.props.onPopupOpen}
                onPopupClose={this.props.onPopupClose}
            >
                <Header
                    text={gettext('Add New Event Location')}
                    onClose={this.props.onCancel}
                />
                <Content className="addgeolookup__suggests-wrapper">
                    <Field
                        component={TextInput}
                        field="location.name"
                        label={gettext('Name')}
                        onChange={this.onChange}
                        value={item.location.name}
                        required
                        noMargin
                        refNode={this.dom.name}
                    />
                    <Field
                        component={TextInput}
                        field="location.address.line[0]"
                        label={gettext('Address')}
                        onChange={this.onChange}
                        value={item.location.address.line?.[0]}
                        required
                        noMargin
                    />
                    <Field
                        component={TextInput}
                        field="location.address.area"
                        label={gettext('Area')}
                        onChange={this.onChange}
                        value={item.location.address.area}
                        noMargin
                    />
                    <Field
                        component={TextInput}
                        field="location.address.suburb"
                        label={gettext('Suburb')}
                        onChange={this.onChange}
                        value={item.location.address.suburb}
                        noMargin
                    />
                    <Field
                        component={TextInput}
                        field="location.address.city"
                        label={gettext('City/Town')}
                        onChange={this.onChange}
                        value={item.location.address.city}
                        required
                        noMargin
                    />
                    <Field
                        component={TextInput}
                        field="location.address.locality"
                        label={gettext('Locality')}
                        onChange={this.onChange}
                        value={item.location.address.locality}
                        noMargin
                    />
                    <Field
                        component={SelectInputWithFreeText}
                        field="state"
                        label={gettext('State/Province/Region')}
                        onChange={this.onChange}
                        value={item.state}
                        options={this.props.regions}
                        labelField="name"
                        textInput={typeof item.state === 'string' && item.state?.length > 0}
                        noMargin
                        clearable
                    />
                    <Field
                        component={TextInput}
                        field="location.address.postal_code"
                        label={gettext('Post Code')}
                        onChange={this.onChange}
                        value={item.location.address.postal_code}
                        noMargin
                    />
                    <Field
                        component={SelectInputWithFreeText}
                        field="country"
                        label={gettext('Country')}
                        onChange={this.onChange}
                        options={this.props.countries}
                        value={item.country}
                        labelField="name"
                        textInput={typeof item.country === 'string' && item.country?.length > 0}
                        required
                        noMargin
                        clearable
                    />
                    <Field
                        component={TextAreaInput}
                        field="location.details[0]"
                        label={gettext('Notes')}
                        onChange={this.onChange}
                        value={item.location?.details?.[0]}
                        noMargin
                        autoHeight={false}
                        rows={3}
                        labelIcon="icon-info-sign icon--blue sd-padding-r--3"
                    />
                </Content>
                <Footer>
                    <ButtonList buttonList={buttons} />
                </Footer>
            </Popup>
        );
    }
}
