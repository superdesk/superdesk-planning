import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import Geolookup from 'react-geolookup';
import DebounceInput from 'react-debounce-input';
import * as Nominatim from 'nominatim-browser';
import {formatAddress, gettext} from '../../utils';
import {get, has} from 'lodash';
import {TextAreaInput} from '../UI/Form';
import {AddGeoLookupResultsPopUp} from './AddGeoLookupResultsPopUp';

import './style.scss';

/**
* Modal for adding/editing a location with nominatim search
*/

export class GeoLookupInputComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            searchResults: null,
            openSuggestsPopUp: false,
            unsavedInput: '',
            localSearchResults: null,
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.resetSearchResults = this.resetSearchResults.bind(this);
        this.onSuggestSelect = this.onSuggestSelect.bind(this);
        this.handleSearchClick = this.handleSearchClick.bind(this);
        this.onSuggestResults = this.onSuggestResults.bind(this);
        this.setLocalLocations = this.setLocalLocations.bind(this);

        this.dom = {
            geolookup: null,
            parent: null,
        };
    }

    setLocalLocations(data = null) {
        let results = null;

        if (get(data, '_items.length', 0) > 0) {
            results = data._items.map((location) => ({
                ...location,
                existingLocation: true,
            }));
        }

        this.setState({localSearchResults: results});
    }

    componentWillReceiveProps(nextProps) {
        if (!get(nextProps.initialValue, 'name')) {
            this.resetSearchResults(true);
        } else if (get(nextProps.initialValue, 'name.length') > 1) {
            if ((!get(nextProps, 'initialValue.address') && !get(nextProps, 'initialValue.nominatim.address')) &&
            nextProps.initialValue.name !== this.props.initialValue.name) {
                this.props.searchLocalLocations(nextProps.initialValue.name.trim())
                    .then(this.setLocalLocations);
            }
        }
    }

    handleInputChange(event) {
        this.dom.geolookup.onInputChange(event.target.value.replace(/(?:\r\n|\r|\n)/g, ' '));
        this.handleChange(event.target.value);

        // Open pop-up to show external search option
        if (get(event.target, 'value.length') > 1) {
            this.setState({
                openSuggestsPopUp: true,
                unsavedInput: event.target.value,
            });
        }
    }

    handleSearchClick() {
        this.dom.geolookup.hideSuggests();
        this.dom.geolookup.onButtonClick();
    }

    onSuggestResults(suggests) {
        this.setState({
            searchResults: suggests,
            openSuggestsPopUp: true,
        });
    }

    resetSearchResults(resetInputText) {
        const textState = resetInputText ? {unsavedInput: ''} : '';

        if (this.state.searchResults || this.state.openSuggestsPopUp) {
            this.setState({
                ...textState,
                searchResults: null,
                openSuggestsPopUp: false,
            });
        } else if (this.state.unsavedInput !== textState) {
            this.setState({...textState});
        }

        if (get(this.state, 'localSearchResults.length', 0) > 0) {
            this.setLocalLocations();
        }
    }

    handleChange(value) {
        if (!value) {
            this.props.onChange(this.props.field, null);
        } else {
            this.props.onChange(this.props.field, {name: value});
        }
    }

    /**
    * When a suggest got selected
    *    @param  {Object} suggest The suggest
    */
    onSuggestSelect(suggest) {
        this.props.onChange(this.props.field, this.onGeocodeSuggest(suggest));
        this.resetSearchResults();
    }

    onSuggestsLookup(userInput) {
        return Nominatim.geocode({
            q: userInput,
            addressdetails: true,
            extratags: true,
            namedetails: true,
        });
    }

    onGeocodeSuggest(suggest) {
        if (!suggest) return null;

        if (suggest.existingLocation) {
            return {...suggest};
        } else {
            const {shortName} = has(suggest, 'raw') ? formatAddress(suggest.raw) : {};

            return {
                nominatim: get(suggest, 'raw', {}),
                location: {
                    lat: get(suggest, 'raw.lat'),
                    lon: get(suggest, 'raw.lon'),
                },
                placeId: get(suggest, 'placeId'),
                label: shortName,
                // used for the field value
                name: shortName,
            };
        }
    }

    getSuggestLabel(suggest) {
        return formatAddress(suggest).shortName;
    }

    render() {
        let locationName = get(this.props.initialValue, 'name') || this.state.unsavedInput;
        let formattedAddress = '';
        let displayText = locationName;

        if (get(this.props.initialValue, 'address')) {
            // Location from local locations collection in database
            formattedAddress = formatAddress(this.props.initialValue).formattedAddress;
            displayText = displayText + '\n' + formattedAddress;
        } else if (get(this.props.initialValue, 'nominatim.address')) {
            // Location select from lookup suggests
            locationName = get(this.props.initialValue.nominatim, 'namedetails.name');
            formattedAddress = formatAddress(this.props.initialValue.nominatim).formattedAddress;
            displayText = locationName + '\n' + formattedAddress;
        }

        return this.props.readOnly ? (
            <div className="addgeolookup">
                <div className="sd-line-input__input sd-line-input__input--disabled">
                    {locationName}
                    <span className="sd-line-input__input--address">
                        <br />
                        {formattedAddress}
                    </span>
                </div>
            </div>
        ) : (
            <div className="addgeolookup" ref={(node) => this.dom.parent = node}>
                <DebounceInput
                    minLength={2}
                    debounceTimeout={500}
                    value={displayText}
                    onChange={this.handleInputChange}
                    placeholder={gettext('Search for a location')}
                    element={TextAreaInput}
                    nativeOnChange={true}
                    noLabel={true}
                    noMargin={true}
                    onFocus={this.props.onFocus}
                    field={this.props.field}
                />

                {this.state.openSuggestsPopUp && (
                    <AddGeoLookupResultsPopUp
                        localSuggests={this.state.localSearchResults}
                        suggests={this.state.searchResults}
                        onCancel={this.resetSearchResults}
                        onChange={this.onSuggestSelect}
                        handleSearchClick={this.handleSearchClick}
                        showExternalSearch={!this.props.readOnly && !this.props.disableSearch}
                        target="sd-line-input__input"
                    />
                )}

                {get(this.state.searchResults, 'length') === 0 && (
                    <div className="error-block" style={{display: 'table-row'}}>No results found</div>
                )}

                <Geolookup
                    disableAutoLookup={true}
                    onSuggestSelect={this.onSuggestSelect}
                    onSuggestsLookup={this.onSuggestsLookup}
                    onGeocodeSuggest={this.onGeocodeSuggest}
                    onSuggestResults={this.onSuggestResults}
                    getSuggestLabel={this.getSuggestLabel}
                    readOnly={false}
                    ignoreTab
                    ref={(node) => this.dom.geolookup = node}
                />
            </div>
        );
    }
}

GeoLookupInputComponent.propTypes = {
    field: PropTypes.string,
    initialValue: PropTypes.object,
    onChange: PropTypes.func,
    readOnly: PropTypes.bool,
    searchLocalLocations: PropTypes.func,
    onFocus: PropTypes.func,
    disableSearch: PropTypes.bool,
};

const mapDispatchToProps = (dispatch) => ({
    searchLocalLocations: (text) => dispatch(actions.locations.getLocation(text)),
});

export const AddGeoLookupInput = connect(
    null,
    mapDispatchToProps
)(GeoLookupInputComponent);
