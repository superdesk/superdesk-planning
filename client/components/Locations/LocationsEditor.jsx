import React from 'react';
import PropTypes from 'prop-types';
import {SidePanel, Header, Content} from '../UI/SidePanel';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import {Field, TextInput, SelectInput, SelectInputWithFreeText} from '../UI/Form';
import {omit, get, isObject} from 'lodash';
import {Footer} from '../UI/Popup';
import {ButtonList} from '../UI';
import {formatAddress, gettext} from '../../utils';
import * as actions from '../../actions';
import {Tabs} from '../UI/Nav';


export class LocationsEditorComponent extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.setActiveTab = this.setActiveTab.bind(this);
        this.state = {
            formInvalid: true,
            name: '',
            address: '',
            state: '',
            country: null,
            city: '',
            postal_code: '',
            lat: null,
            invalid_lat: false,
            long: null,
            invalid_long: false,
            bad_lat_message: '',
            bad_long_message: '',
            tab: 0,
            formNew: true,
        };

        this.tabs = [
            {
                label: gettext('Edit Location'),
                enabled: true,
            },
        ];
    }

    loadState(item) {
        this.setState({
            formInvalid: true,
            name: get(item, 'name', ''),
            address: get(item, 'address.line[0]', ''),
            state: this.props.regions.find((r) => r.name === get(item, 'address.locality')) ||
                        this.props.regions.find((r) => r.qcode === get(item, 'address.locality')) ||
                        get(item, 'address.locality', ''),
            country: this.props.countries.find((c) => c.name === get(item, 'address.country', '')),
            city: get(item, 'address.area', ''),
            postal_code: get(item, 'address.postal_code', ''),
            lat: get(item, 'position.latitude'),
            invalid_lat: false,
            long: get(item, 'position.longitude'),
            invalid_long: false,
            bad_lat_message: '',
            bad_long_message: '',
            tab: 0,
            formNew: false,
        });
    }

    componentDidMount() {
        const {item} = this.props;

        if (get(item, '_id', null) !== null) {
            this.loadState(item);
        }
    }

    componentWillReceiveProps(nextProps) {
        // If the Location item has changed, then load the state
        const nextId = get(nextProps, 'item._id', null);
        const currentId = get(this.props, 'item._id', null);

        if (nextId !== currentId) {
            this.loadState(nextProps.item);
        }
    }

    onChange(field, value) {
        const values = {
            ...omit(this.state, ['formInvalid', field, 'city', 'state', 'postal_code', 'long', 'lat',
                'bad_lat_message', 'bad_long_message', 'invalid_lat', 'invalid_long', 'tab', 'formNew']),
            [field]: value,
        };

        if (field === 'lat' && value.length) {
            let v = parseFloat(value);

            if (isNaN(v) || v > 90.0 || v < -90.0) {
                this.setState({[field]: v, formInvalid: true, bad_lat_message: 'Invalid value for latitude',
                    invalid_lat: true});
                return;
            } else {
                this.setState({bad_lat_message: '', invalid_lat: false});
            }
        }

        if (field === 'long' && value.length) {
            let v = parseFloat(value);

            if (isNaN(v) || v > 180.0 || v < -180.0) {
                this.setState({[field]: v, formInvalid: true, bad_long_message: 'Invalid value for longitude',
                    invalid_long: true});
                return;
            } else {
                this.setState({bad_long_message: '', invalid_long: false});
            }
        }

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
                state: get(this.state.state, 'name', isObject(this.state.state) ? '' : this.state.state),
                country: get(this.state.country, 'name'),
                postcode: get(this.state, 'postal_code'),
            },
        });

        locationAddress.name = get(this, 'state.name');
        if (get(this, 'state.lat') && get(this, 'state.lat')) {
            locationAddress.position = {};
            locationAddress.position.latitude = get(this, 'state.lat');
            locationAddress.position.longitude = get(this, 'state.long');
        }
        locationAddress.unique_name = get(this, 'state.name').concat(' ', locationAddress.formattedAddress);
        this.props.saveLocation(this.props.item, omit(locationAddress, ['shortName', 'formattedAddress']));
    }

    onCancel() {
        this.props.onCancel();
    }

    setActiveTab(tab) {
        this.setState({tab});
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
            text: get(this, 'state.formNew') ? gettext('Create') : gettext('Save'),
            disabled: get(this, 'state.formInvalid', true),
        },
        ];

        return (
            <SidePanel shadowRight={true} className={this.props.className}>
                <Header className="side-panel__header--border-b" darkBlue={true}>
                    <Tabs
                        tabs={this.tabs}
                        active={this.state.tab}
                        setActive={this.setActiveTab}
                        darkUi={true}
                    />
                </Header>
                <Content flex={true} className={this.props.contentClassName}>
                    <Field
                        component={TextInput}
                        field="name"
                        label={gettext('Name')}
                        value={get(this, 'state.name')}
                        onChange={this.onChange}
                        required
                        noMargin
                    />
                    <Field
                        component={TextInput}
                        field="address"
                        label={gettext('Address')}
                        value={get(this, 'state.address')}
                        required
                        onChange={this.onChange}
                        noMargin
                    />
                    <Field
                        component={TextInput}
                        field="city"
                        label={gettext('City/Town')}
                        value={get(this, 'state.city')}
                        onChange={this.onChange}
                        noMargin
                    />
                    <Field
                        component={SelectInputWithFreeText}
                        field="state"
                        label={gettext('State/Province/Region')}
                        value={get(this, 'state.state')}
                        onChange={this.onChange}
                        options={this.props.regions}
                        labelField="name"
                        textInput={!isObject(get(this, 'state.state')) && get(this, 'state.state', '').length > 0}
                        noMargin
                        clearable
                    />
                    <Field
                        component={TextInput}
                        field="postal_code"
                        label={gettext('Post Code')}
                        value={get(this, 'state.postal_code')}
                        onChange={this.onChange}
                        noMargin
                    />
                    <Field
                        component={SelectInput}
                        field="country"
                        label={gettext('Country')}
                        options={this.props.countries}
                        value={get(this, 'state.country')}
                        onChange={this.onChange}
                        labelField="name"
                        required
                        noMargin
                        clearable
                    />
                    <Field
                        component={TextInput}
                        field="lat"
                        label={gettext('Latitude')}
                        value={get(this, 'state.lat')}
                        onChange={this.onChange}
                        invalid={get(this, 'state.invalid_lat')}
                        message={gettext(get(this, 'state.bad_lat_message'))}
                    />
                    <Field
                        component={TextInput}
                        field="long"
                        label={gettext('Longitude')}
                        value={get(this, 'state.long')}
                        onChange={this.onChange}
                        invalid={get(this, 'state.invalid_long')}
                        message={gettext(get(this, 'state.bad_long_message'))}
                    />
                </Content>
                <Footer>
                    <ButtonList buttonList={buttons} />
                </Footer>
            </SidePanel>
        );
    }
}

LocationsEditorComponent.propTypes = {
    className: PropTypes.string,
    contentClassName: PropTypes.string,
    item: PropTypes.object,
    regions: PropTypes.array,
    countries: PropTypes.array,
    saveLocation: PropTypes.func,
    onCancel: PropTypes.func,
};

const mapStateToProps = (state) => ({
    item: selectors.locations.getEditLocation(state),
    regions: selectors.general.regions(state),
    countries: selectors.general.countries(state),
});

const mapDispatchToProps = (dispatch) => ({
    saveLocation: (original, update) => dispatch(actions.locations.updateLocation(original, update)),
    onCancel: () => dispatch(actions.locations.clearEdits()),
});

LocationsEditorComponent.defaultProps = {
    contentClassName: 'side-panel__content-block',
    className: 'content-container no-padding',
};

export const LocationsEditor = connect(
    mapStateToProps,
    mapDispatchToProps
)(LocationsEditorComponent);

