import React from 'react';
import PropTypes from 'prop-types';
import {omit} from 'lodash';
import {formatAddress} from '../../utils';
import {gettext} from '../../utils/gettext';
import {ButtonList} from '../UI';
import {Field, TextInput} from '../UI/Form';
import './style.scss';

import {Popup, Content, Footer, Header} from '../UI/Popup';

export class CreateNewGeoLookup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            formInvalid: true,
            name: this.props.initialName,
            address: '',
            state: '',
            country: '',
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
            ...omit(this.state, ['formInvalid', field]),
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
                locality: this.state.state,
                country: this.state.country,
            },
        });

        this.props.onSave({
            name: this.state.name,
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
                className="addgeolookup__popup"
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
                        field="state"
                        label={gettext('State')}
                        onChange={this.onChange}
                        value={this.state.state}
                        required
                        noMargin
                    />
                    <Field
                        component={TextInput}
                        field="country"
                        label={gettext('Country')}
                        onChange={this.onChange}
                        value={this.state.country}
                        required
                        noMargin
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
    onChange: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    handleSearchClick: PropTypes.func,
    onLocalSearchOnly: PropTypes.func,
    onSave: PropTypes.func,
    showExternalSearch: PropTypes.bool,
    showAddLocation: PropTypes.bool,
    target: PropTypes.string.isRequired,
    initialName: PropTypes.string,
};
