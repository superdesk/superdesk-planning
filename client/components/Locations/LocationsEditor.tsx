import React from 'react';
import {connect} from 'react-redux';
import {set, isEqual, cloneDeep} from 'lodash';

import {IVocabularyItem} from 'superdesk-api';
import {ILocation} from '../../interfaces';
import {superdeskApi, planningApi} from '../../superdeskApi';

import * as selectors from '../../selectors';
import {formatLocationToAddress} from '../../utils/locations';

import {ButtonGroup, Button} from 'superdesk-ui-framework/react';
import {SidePanel, Header, Content, ContentBlock, ContentBlockInner} from '../UI/SidePanel';
import {Field, TextInput, SelectInputWithFreeText, TextAreaInput} from '../UI/Form';
import {OpenStreetMapPreviewList} from './OpenStreetMapPreviewList';

interface IProps {
    className?: string; // defaults to 'content-container no-padding'
    contentClassName?: string; // defaults to 'side-panel__content-block'
    item?: ILocation;
    regions: Array<IVocabularyItem>;
    countries: Array<IVocabularyItem>;
}

interface IState {
    form: {
        invalid: boolean;
        dirty: boolean;
        invalidLat: boolean;
        badLatMessage?: string;
        invalidLong: boolean;
        badLongMessage?: string;
    };
    item: {
        location: Partial<ILocation>;
        state?: IVocabularyItem | string;
        country?: IVocabularyItem | string;
        latitude?: string;
        longitude?: string;
    };
}

const mapStateToProps = (state) => ({
    item: selectors.locations.getEditLocation(state),
    regions: selectors.general.regions(state),
    countries: selectors.general.countries(state),
});

const DEFAULT_FORM_STATE: IState['form'] = {
    dirty: false,
    invalid: true,
    invalidLat: false,
    invalidLong: false,
};

function getItemStateFromProps(props: IProps): IState['item'] {
    if (props.item == null) {
        return {
            location: {
                address: {},
            },
        };
    }

    const location: Partial<ILocation> = {...props.item ?? {address: {}}};

    const state = props.regions.find(
        (region) => region.name === location.address.state || region.qcode === location.address.state
    ) || location.address?.state;
    const country = props.countries.find(
        (country) => country.name === location.address.country
    ) || location.address?.country;

    return {
        location: location,
        country: country,
        state: state,
        latitude: location.position?.longitude?.toString() ?? '',
        longitude: location.position?.longitude?.toString() ?? '',
    };
}

export class LocationsEditorComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.onSave = this.onSave.bind(this);
        this.state = {
            form: {...DEFAULT_FORM_STATE},
            item: getItemStateFromProps(this.props),
        };
    }

    static getDerivedStateFromProps(props: IProps, state: IState) {
        if (props.item?._id !== state.item?.location?._id) {
            return {
                form: {...DEFAULT_FORM_STATE},
                item: getItemStateFromProps(props),
            };
        }

        return null;
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

        if (item.latitude?.length && item.longitude?.length) {
            location.position = {
                latitude: parseFloat(item.latitude),
                longitude: parseFloat(item.longitude),
            };
        }

        return location;
    }

    getFormStates(item: IState['item']): IState['form'] {
        const {gettext} = superdeskApi.localization;
        const location = this.getLocationFromState(item);
        let invalidLat: boolean = false;
        let invalidLong: boolean = false;

        if (location.position != null) {
            const {latitude, longitude} = location.position ?? {};

            invalidLat = isNaN(latitude) || latitude > 90.0 || latitude < -90.0;
            invalidLong = isNaN(longitude) || longitude > 180.0 || longitude < -180.0;
        }

        return {
            dirty: !isEqual(location, this.props.item),
            invalid: !location.name?.length ||
                !location.address.line?.[0]?.length ||
                !location.address.country?.length,
            invalidLat: invalidLat,
            badLatMessage: !invalidLat ? null : gettext('Invalid value for latitude'),
            invalidLong: invalidLong,
            badLongMessage: !invalidLong ? null : gettext('Invalid value for longitude'),
        };
    }

    onChange(field: string, value: string) {
        const item: IState['item'] = cloneDeep(this.state.item);

        set(item, field, value);
        this.setState({
            form: this.getFormStates(item),
            item: item,
        });
    }

    onSave() {
        const location = this.getLocationFromState(this.state.item);

        (location._id != null ?
            planningApi.locations.update(this.props.item, location) :
            planningApi.locations.create(location)
        ).then(() => {
            planningApi.locations.closeEditor();
        });
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {item} = this.state;

        return (
            <SidePanel
                shadowRight={true}
                bg00={true}
                className={this.props.className ?? 'content-container no-padding'}
            >
                <Header
                    className="subnav"
                    darker={true}
                >
                    <h3 className="side-panel__heading">
                        {item.location?._id == null ?
                            gettext('Create New Location') :
                            gettext('Edit Location')
                        }
                    </h3>
                    <ButtonGroup align="right">
                        <Button
                            text={!this.state.form?.dirty ?
                                gettext('Close') :
                                gettext('Cancel')
                            }
                            onClick={planningApi.locations.closeEditor}
                        />
                        <Button
                            text={item.location?._id == null ?
                                gettext('Create') :
                                gettext('Save')
                            }
                            onClick={this.onSave}
                            disabled={!this.state.form?.dirty || this.state.form?.invalid}
                            type="primary"
                        />
                    </ButtonGroup>
                </Header>
                <Content>
                    <ContentBlock flex={true}>
                        <ContentBlockInner grow={true}>
                            <Field
                                component={TextInput}
                                field="location.name"
                                label={gettext('Name')}
                                value={item.location.name}
                                onChange={this.onChange}
                                required
                                noMargin
                            />
                            <Field
                                component={TextInput}
                                field="location.address.line[0]"
                                label={gettext('Address')}
                                value={item.location.address.line?.[0]}
                                required
                                onChange={this.onChange}
                                noMargin
                            />
                            <Field
                                component={TextInput}
                                field="location.address.area"
                                label={gettext('Area')}
                                value={item.location.address.area}
                                onChange={this.onChange}
                                noMargin
                            />
                            <Field
                                component={TextInput}
                                field="location.address.suburb"
                                label={gettext('Suburb')}
                                value={item.location.address.suburb}
                                onChange={this.onChange}
                                noMargin
                            />
                            <Field
                                component={TextInput}
                                field="location.address.city"
                                label={gettext('City/Town')}
                                value={item.location.address.city}
                                onChange={this.onChange}
                                noMargin
                            />
                            <Field
                                component={TextInput}
                                field="location.address.locality"
                                label={gettext('Locality')}
                                value={item.location.address.locality}
                                onChange={this.onChange}
                                noMargin
                            />
                            <Field
                                component={SelectInputWithFreeText}
                                field="state"
                                label={gettext('State/Province/Region')}
                                value={item.state}
                                onChange={this.onChange}
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
                                value={item.location.address.postal_code}
                                onChange={this.onChange}
                                noMargin
                            />
                            <Field
                                component={SelectInputWithFreeText}
                                field="country"
                                label={gettext('Country')}
                                options={this.props.countries}
                                value={item.country}
                                onChange={this.onChange}
                                labelField="name"
                                textInput={typeof item.country === 'string' && item.country?.length > 0}
                                required
                                noMargin
                                clearable
                            />
                            <Field
                                component={TextInput}
                                field="latitude"
                                label={gettext('Latitude')}
                                value={item.latitude}
                                onChange={this.onChange}
                                invalid={this.state.form.invalidLat}
                                message={this.state.form.badLatMessage}
                            />
                            <Field
                                component={TextInput}
                                field="longitude"
                                label={gettext('Longitude')}
                                value={item.longitude}
                                onChange={this.onChange}
                                invalid={this.state.form.invalidLong}
                                message={this.state.form.badLongMessage}
                            />
                            <Field
                                component={TextAreaInput}
                                field="location.details[0]"
                                label={gettext('Notes')}
                                value={item.location?.details?.[0]}
                                onChange={this.onChange}
                                autoHeight={true}
                                labelIcon="icon-info-sign icon--blue sd-padding-r--3"
                            />
                            <OpenStreetMapPreviewList
                                location={this.props.item}
                            />
                        </ContentBlockInner>
                    </ContentBlock>
                </Content>
            </SidePanel>
        );
    }
}

export const LocationsEditor = connect(mapStateToProps)(LocationsEditorComponent);
