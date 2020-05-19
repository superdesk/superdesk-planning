import React from 'react';
import PropTypes from 'prop-types';
import {omit, get, isObject} from 'lodash';
import {formatAddress} from '../../utils';
import {gettext} from '../../utils/gettext';
import {ButtonList} from '../UI';
import {Field, TextInput, SelectInput, SelectInputWithFreeText, TextAreaInput} from '../UI/Form';
import './style.scss';

import {Popup, Content, Footer, Header} from '../UI/Popup';

export class CreateNewGeoLookup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            formInvalid: true,
            name: this.props.initialName,
            address: this.props.initialAddressIsName ? this.props.initialName : '',
            state: '',
            country: (this.props.defaultCountry || ''),
            city: '',
            details: '',
        };
        this.dom = {name: null};

        this.onChange = this.onChange.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onCancel = this.onCancel.bind(this);
    }

    componentDidMount() {
        if (this.dom.name) {
            this.dom.name.focus();
        }
    }

    onChange(field, value) {
        const values = {
            ...omit(this.state, ['formInvalid', field, 'city', 'state', 'details']),
            [field]: value,
        };

        this.setState({
            [field]: value,
            formInvalid: Object.keys(values).filter((v) => !values[v]).length > 0,
        });
    }

    onSave() {
        const locationAddress = formatAddress({
            address: {
                road: this.state.address,
                locality: this.state.city,
                state: get(this.state.state, 'name', this.state.state),
                country: get(this.state.country, 'name'),
            },
        });

        this.props.onSave({
            name: this.state.name,
            details: [get(this, 'state.details')],
            address: omit(locationAddress.address, 'external'),

        });
        this.onCancel();
    }

    onCancel() {
        this.props.onCancel();
    }

    render() {
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
                    onClose={this.props.onCancel} />
                <Content className="addgeolookup__suggests-wrapper">
                    <Field
                        component={TextInput}
                        field="name"
                        label={gettext('Name')}
                        onChange={this.onChange}
                        value={this.state.name}
                        required
                        noMargin
                    />
                    <Field
                        component={TextInput}
                        field="address"
                        label={gettext('Address')}
                        onChange={this.onChange}
                        value={this.state.address}
                        required
                        noMargin
                    />
                    <Field
                        component={TextInput}
                        field="city"
                        label={gettext('City/Town')}
                        onChange={this.onChange}
                        value={this.state.city}
                        noMargin
                    />
                    <Field
                        component={SelectInputWithFreeText}
                        field="state"
                        label={gettext('State/Province/Region')}
                        onChange={this.onChange}
                        value={get(this, 'state.state')}
                        options={this.props.regions}
                        labelField="name"
                        textInput={!isObject(get(this, 'state.state')) && get(this, 'state.state', '').length > 0}
                        noMargin
                        clearable
                    />
                    <Field
                        component={SelectInput}
                        field="country"
                        label={gettext('Country')}
                        onChange={this.onChange}
                        options={this.props.countries}
                        value={this.state.country}
                        labelField="name"
                        required
                        noMargin
                        clearable
                    />
                    <Field
                        component={TextAreaInput}
                        field="details"
                        label={gettext('Notes')}
                        onChange={this.onChange}
                        value={get(this, 'state.details')}
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

CreateNewGeoLookup.propTypes = {
    suggests: PropTypes.array,
    localSuggests: PropTypes.array,
    regions: PropTypes.array,
    onCancel: PropTypes.func,
    handleSearchClick: PropTypes.func,
    onLocalSearchOnly: PropTypes.func,
    onSave: PropTypes.func,
    showExternalSearch: PropTypes.bool,
    showAddLocation: PropTypes.bool,
    target: PropTypes.string.isRequired,
    initialName: PropTypes.string,
    popupContainer: PropTypes.func,
    countries: PropTypes.array,
    defaultCountry: PropTypes.object,
    onPopupOpen: PropTypes.func,
    onPopupClose: PropTypes.func,
    initialAddressIsName: PropTypes.bool,
};
