import React from 'react';
import Geolookup from 'react-geolookup';
import DebounceInput from 'react-debounce-input';

import {appConfig} from 'appConfig';
import {IRestApiResponse} from 'superdesk-api';
import {ILocation, IEventLocation} from '../../interfaces';

import {superdeskApi, planningApi} from '../../superdeskApi';

import {formatLocationToAddress} from '../../utils/locations';
import {KEYCODES} from '../../constants';

import {AddGeoLookupResultsPopUp} from './AddGeoLookupResultsPopUp';
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
    language?: string;
    onChange(field: string, value?: Partial<ILocation>): void;
    onFocus?(): void;
    popupContainer?(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
    showAddLocationForm(props: any): Promise<ILocation | undefined>;
}

interface IState {
    searchResults?: Array<Partial<ILocation>>;
    openSuggestsPopUp: boolean;
    unsavedInput: string;
    localSearchResults?: Array<ILocation>;
    searchLocalAlways: boolean;
    searching: boolean;
}

export class AddGeoLookupInput extends React.Component<IProps, IState> {
    dom: {
        input: React.RefObject<HTMLInputElement>;
        geolookup: React.RefObject<Geolookup>;
    };

    constructor(props) {
        super(props);
        this.state = {
            searchResults: null,
            openSuggestsPopUp: false,
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

    onAddNewLocation() {
        this.setState({
            openSuggestsPopUp: false,
            searching: false,
            searchLocalAlways: true,
        }, () => {
            this.props.showAddLocationForm({
                initialName: this.state.unsavedInput,
                initialAddressIsName: appConfig.planning_allow_freetext_location,
            })
                .then((location) => {
                    if (location != null) {
                        this.onSuggestSelect(location);
                        this.setState({unsavedInput: ''});
                    }
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
