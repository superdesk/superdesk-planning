import React from 'react';
import {connect} from 'react-redux';
import Geolookup from 'react-geolookup';
import DebounceInput from 'react-debounce-input';

import {appConfig} from 'appConfig';
import {IUser, IVocabularyItem, IRestApiResponse} from 'superdesk-api';
import {ILocation, IEventLocation} from '../../interfaces';

import {superdeskApi, planningApi} from '../../superdeskApi';

import * as selectors from '../../selectors';
import {formatLocationToAddress} from '../../utils/locations';
import {KEYCODES} from '../../constants';

import {AddGeoLookupResultsPopUp} from './AddGeoLookupResultsPopUp';
import {CreateNewGeoLookup} from './CreateNewGeoLookup';
import {LocationItem} from './LocationItem';

import './style.scss';

/**
* Modal for adding/editing a location with nominatim search
*/

interface INominatimItemResponse {
    isFixture: boolean;
    label: string;
    placeId: number;
    raw: Partial<ILocation>;
}

interface IProps {
    field: string;
    initialValue?: ILocation | IEventLocation;
    readOnly?: boolean;
    disableSearch?: boolean;
    disableAddLocation?: boolean;
    users: Array<IUser>;
    regions: Array<IVocabularyItem>;
    countries: Array<IVocabularyItem>;
    preferredCountry?: IVocabularyItem['name'];
    language?: string;
    onChange(field: string, value?: Partial<ILocation>): void;
    onFocus?(): void;
    popupContainer?(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}

interface IState {
    searchResults?: Array<Partial<ILocation>>;
    openSuggestsPopUp: boolean;
    openNewLocationPopup: boolean;
    unsavedInput: string;
    localSearchResults?: Array<ILocation>;
    searchLocalAlways: boolean;
    searching: boolean;
}

const mapStateToProps = (state) => ({
    users: selectors.general.users(state),
    regions: selectors.general.regions(state),
    countries: selectors.general.countries(state),
    preferredCountry: selectors.general.preferredCountry(state),
});

export class GeoLookupInputComponent extends React.Component<IProps, IState> {
    dom: {
        input: React.RefObject<HTMLInputElement>;
        geolookup: React.RefObject<Geolookup>;
    };

    constructor(props) {
        super(props);
        this.state = {
            searchResults: null,
            openSuggestsPopUp: false,
            openNewLocationPopup: false,
            unsavedInput: '',
            localSearchResults: null,
            searchLocalAlways: true,
            searching: false,
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.resetSearchResults = this.resetSearchResults.bind(this);
        this.onSuggestSelect = this.onSuggestSelect.bind(this);
        this.handleSearchClick = this.handleSearchClick.bind(this);
        this.onSuggestResults = this.onSuggestResults.bind(this);
        this.setLocalLocations = this.setLocalLocations.bind(this);
        this.onLocalSearchOnly = this.onLocalSearchOnly.bind(this);
        this.closeSuggestsPopUp = this.closeSuggestsPopUp.bind(this);
        this.closeNewLocationPopUp = this.closeNewLocationPopUp.bind(this);
        this.saveNewLocation = this.saveNewLocation.bind(this);
        this.onAddNewLocation = this.onAddNewLocation.bind(this);
        this.removeLocation = this.removeLocation.bind(this);
        this.searchExternalLocations = this.searchExternalLocations.bind(this);

        this.dom = {
            input: React.createRef(),
            geolookup: React.createRef(),
        };
    }

    focus() {
        this.dom.input.current?.focus();
    }

    closeSuggestsPopUp() {
        this.setState({
            openSuggestsPopUp: false,
            unsavedInput: '',
            searching: false,
            searchLocalAlways: true,
        });
    }

    closeNewLocationPopUp() {
        this.setState({
            openNewLocationPopup: false,
            unsavedInput: '',
            searching: false,
            searchLocalAlways: true,
        });
    }

    onAddNewLocation() {
        this.setState({
            openSuggestsPopUp: false,
            openNewLocationPopup: true,
            searching: false,
            searchLocalAlways: true,
        });
    }

    saveNewLocation(value: Partial<ILocation>) {
        planningApi.locations.getOrCreate(value)
            .then((newLocation) => {
                this.onSuggestSelect(newLocation);
                this.setState({
                    unsavedInput: '',
                    searching: false,
                    searchLocalAlways: true,
                });
            });
    }

    removeLocation() {
        this.props.onChange(this.props.field, null);
    }

    setLocalLocations(data?: IRestApiResponse<ILocation> | undefined) {
        this.setState({localSearchResults: data?._items?.length ?
            data._items :
            null,
        });
    }

    componentDidUpdate(prevProps: Readonly<IProps>) {
        if (prevProps.initialValue?.name?.length && !this.props.initialValue?.name?.length) {
            this.resetSearchResults();
        }
    }

    handleInputChange(event: React.ChangeEvent<HTMLInputElement> & React.KeyboardEvent<HTMLInputElement>) {
        if (appConfig.planning_allow_freetext_location &&
            event.keyCode === KEYCODES.ENTER &&
            this.state.unsavedInput?.length
        ) {
            this.props.onChange(this.props.field, {name: this.state.unsavedInput});
            this.closeSuggestsPopUp();
            return;
        }

        if (this.dom.geolookup.current != undefined) {
            this.dom.geolookup.current.onInputChange(
                event.target.value.replace(/(?:\r\n|\r|\n)/g, ' ')
            );
        }

        // Open pop-up to show external search option
        if ((event.target?.value?.length ?? 0) > 1) {
            this.setState({
                openSuggestsPopUp: true,
                openNewLocationPopup: false,
                unsavedInput: event.target.value,
                searching: !this.state.searchLocalAlways,
                searchLocalAlways: !this.state.openSuggestsPopUp || this.state.searchLocalAlways,
            });

            if (this.state.searchLocalAlways) {
                this.searchLocalLocations(event.target.value);
            } else {
                this.searchGeoLookupComponent();
            }
        }
    }

    searchLocalLocations(name?: string) {
        planningApi.locations.search((name ?? this.state.unsavedInput).trim())
            .then(this.setLocalLocations);
    }

    searchExternalLocations(searchText: string) {
        return planningApi.locations.searchExternal(
            searchText,
            this.props.language
        );
    }

    searchGeoLookupComponent() {
        if (this.dom.geolookup.current != undefined) {
            this.dom.geolookup.current.hideSuggests();
            this.dom.geolookup.current.onButtonClick();
        }
    }

    handleSearchClick() {
        if (this.state.unsavedInput) {
            this.searchGeoLookupComponent();

            this.setState({
                searching: !!this.state.unsavedInput,
                searchLocalAlways: false,
            });
        }
    }

    onSuggestResults(suggests: Array<INominatimItemResponse>) {
        this.setState({
            searchResults: suggests.map(
                (item) => item.raw
            ),
            openSuggestsPopUp: true,
            openNewLocationPopup: false,
            searching: false,
        });
    }

    resetSearchResults() {
        this.setState({
            unsavedInput: '',
            searchLocalAlways: true,
            openSuggestsPopUp: false,
            localSearchResults: null,
        });
    }

    /**
    * When a suggest got selected
    *    @param  {Object} suggest The suggest
    */
    onSuggestSelect(suggest: Partial<ILocation>) {
        (suggest.guid != null ?
            Promise.resolve(suggest as ILocation) :
            planningApi.locations.getOrCreate(suggest)
        ).then((location) => {
            const value: IEventLocation = {
                name: location.name,
                qcode: location.guid,
                address: location.address,
                details: location.details,
            };

            // external address might not be there.
            if (location.address.external != null) {
                delete value.address.external;
            }

            if (location.position != null) {
                value.location = {
                    lat: location.position.latitude,
                    lon: location.position.longitude,
                };
            }

            this.props.onChange(this.props.field, value);
        }).finally(() => this.resetSearchResults());
    }

    getSuggestLabel(location: Partial<ILocation>) {
        return formatLocationToAddress(location);
    }

    onLocalSearchOnly() {
        this.setState({searchLocalAlways: true});
        this.searchLocalLocations();
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            initialValue,
            onFocus,
            field,
            disableSearch,
            disableAddLocation,
            readOnly,
            onPopupOpen,
            onPopupClose,
        } = this.props;

        return (
            <React.Fragment>
                {initialValue?.name == null ? null : (
                    <LocationItem
                        location={initialValue}
                        onRemoveLocation={this.removeLocation}
                        readOnly={readOnly}
                    />
                )}
                <DebounceInput
                    inputRef={this.dom.input}
                    minLength={2}
                    debounceTimeout={500}
                    value={this.state.unsavedInput}
                    onChange={this.handleInputChange}
                    placeholder={gettext('Search for a location')}
                    className="sd-line-input__input"
                    type="text"
                    name="location"
                    onFocus={onFocus}
                    field={field}
                    disabled={readOnly}
                    onKeyDown={this.handleInputChange}
                />

                {this.state.openSuggestsPopUp && (
                    <AddGeoLookupResultsPopUp
                        localSuggests={this.state.localSearchResults}
                        suggests={this.state.searchResults}
                        onCancel={this.closeSuggestsPopUp}
                        onChange={this.onSuggestSelect}
                        handleSearchClick={this.handleSearchClick}
                        showExternalSearch={!readOnly && !disableSearch}
                        showAddLocation={disableAddLocation}
                        onLocalSearchOnly={this.onLocalSearchOnly}
                        searching={this.state.searching}
                        onAddNewLocation={this.onAddNewLocation}
                        onPopupOpen={onPopupOpen}
                        onPopupClose={onPopupClose}
                        target="sd-line-input__input"
                    />
                )}

                {this.state.openNewLocationPopup && (
                    <CreateNewGeoLookup
                        initialName={this.state.unsavedInput}
                        onSave={this.saveNewLocation}
                        onCancel={this.closeNewLocationPopUp}
                        target="sd-line-input__input"
                        popupContainer={this.props.popupContainer}
                        regions={this.props.regions}
                        countries={this.props.countries}
                        defaultCountry={this.props.preferredCountry}
                        initialAddressIsName={appConfig.planning_allow_freetext_location}
                        onPopupOpen={onPopupOpen}
                        onPopupClose={onPopupClose}
                    />
                )}

                <Geolookup
                    disableAutoLookup={true}
                    onSuggestSelect={this.onSuggestSelect}
                    onSuggestsLookup={this.searchExternalLocations}
                    onSuggestResults={this.onSuggestResults}
                    getSuggestLabel={this.getSuggestLabel}
                    readOnly={false}
                    ignoreTab
                    ref={this.dom.geolookup}
                />
            </React.Fragment>
        );
    }
}

export const AddGeoLookupInput = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(GeoLookupInputComponent);
