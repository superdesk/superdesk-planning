import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'
import { formValueSelector } from 'redux-form'
import * as actions from '../../actions'
import Geolookup from 'react-geolookup'
import DebounceInput from 'react-debounce-input'
import * as Nominatim from 'nominatim-browser'
import './style.scss'
import classNames from 'classnames'
import { formatAddress } from '../../utils'
import { LOCATIONS } from '../../constants'
import { get, has } from 'lodash'
import TextareaAutosize from 'react-textarea-autosize'
import { AddGeoLookupResultsPopUp } from './AddGeoLookupResultsPopUp'

/**
* Modal for adding/editing a location with nominatim search
*/

export class GeoLookupInputComponent extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            searchResults: null,
            openSuggestsPopUp: false,
            unsavedInput: '',
        }
        this.handleClickOutside = this.handleClickOutside.bind(this)
    }

    handleClickOutside(event) {
        const domNode = ReactDOM.findDOMNode(this)

        if ((!domNode || !domNode.contains(event.target))) {
            this.resetSearchResults()
        }
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true)
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true)
    }

    componentWillReceiveProps(nextProps) {
        if (!get(nextProps.initialValue, 'name')) {
            this.resetSearchResults(true)
        } else if (get(nextProps.initialValue, 'name.length') > 1) {
            if ((!get(nextProps, 'initialValue.address') && !get(nextProps, 'initialValue.nominatim.address')) &&
            nextProps.initialValue.name !== this.props.initialValue.name) {
                this.props.searchLocalLocations(nextProps.initialValue.name.trim())
            }
        }
    }

    handleInputChange(event) {
        this.refs.geolookup.onInputChange(event.target.value.replace(/(?:\r\n|\r|\n)/g, ' '))
        this.handleChange(event.target.value)

        // Open pop-up to show external search option
        if (get(event.target, 'value.length') > 1 && !this.state.openSuggestsPopUp) {
            this.setState({
                openSuggestsPopUp : true,
                unsavedInput: event.target.value,
            })
        }
    }

    handleSearchClick() {
        this.refs.geolookup.hideSuggests()
        this.refs.geolookup.onButtonClick()
    }

    onSuggestResults(suggests) {
        this.setState({
            searchResults : suggests,
            openSuggestsPopUp: true,
        })
    }

    resetSearchResults(resetInputText) {
        const textState = resetInputText ? { unsavedInput: '' } : ''
        if (this.state.searchResults || this.state.openSuggestsPopUp) {
            this.setState({
                ...textState,
                searchResults : null,
                openSuggestsPopUp: false,
            })
        } else if (this.state.unsavedInput !== textState) {
            this.setState({ ...textState })
        }

        if (this.props.localSearchResults) {
            this.props.resetLocalSearchResults()
        }
    }

    render() {
        const textAreaClassNames = classNames(
            'sd-line-input__input',
            { disabledInput: this.props.readOnly }
        )


        let locationName = get(this.props.initialValue, 'name') || this.state.unsavedInput
        let formattedAddress = ''
        let displayText = locationName

        if (get(this.props.initialValue, 'address')) {
            // Location from local locations collection in database
            formattedAddress = formatAddress(this.props.initialValue).formattedAddress
            displayText = displayText + '\n' + formattedAddress
        } else if (get(this.props.initialValue, 'nominatim.address')) {
            // Location select from lookup suggests
            locationName = get(this.props.initialValue.nominatim, 'namedetails.name')
            formattedAddress = formatAddress(this.props.initialValue.nominatim).formattedAddress
            displayText = locationName + '\n' + formattedAddress
        }

        return (
            <div className='addgeolookup sd-line-input__input'>
                {this.props.readOnly &&
                    <span className='addgeolookup__input-wrapper'>
                        {locationName}
                        <span style={{
                            'font-style': 'italic',
                            'font-size': 'small',
                        }}>
                            <br />
                            {formattedAddress}
                        </span>
                    </span>
                }
                {!this.props.readOnly && <span className='addgeolookup__input-wrapper'>
                <DebounceInput
                    minLength={2}
                    debounceTimeout={500}
                    value={displayText}
                    onChange={this.handleInputChange.bind(this)}
                    placeholder="Location"
                    element={TextareaAutosize}
                    className={textAreaClassNames}
                    disabled={this.props.readOnly ? 'disabled' : ''} />
                </span>}
                {this.state.openSuggestsPopUp && <AddGeoLookupResultsPopUp
                        localSuggests={this.props.localSearchResults}
                        suggests={this.state.searchResults}
                        onCancel={this.resetSearchResults.bind(this)}
                        onChange={this.onSuggestSelect.bind(this)}
                        handleSearchClick={this.handleSearchClick.bind(this)}
                        showExternalSearch={!this.props.readOnly} />
                }
                {get(this.state.searchResults, 'length') === 0 &&
                    <div className="error-block" style={{ display: 'table-row' }}>No results found</div>}
                {!this.props.readOnly && <Geolookup
                    disableAutoLookup={true}
                    onSuggestSelect={this.onSuggestSelect.bind(this)}
                    onSuggestsLookup={this.onSuggestsLookup}
                    onGeocodeSuggest={this.onGeocodeSuggest}
                    onSuggestResults={this.onSuggestResults.bind(this)}
                    getSuggestLabel={this.getSuggestLabel}
                    disabled={this.props.readOnly}
                    ignoreTab
                    ref="geolookup"
                />}
            </div>
        )
    }

    handleChange(value) {
        this.props.onChange({ name: value })
    }

    /**
    * When a suggest got selected
    *    @param  {Object} suggest The suggest
    */
    onSuggestSelect(suggest) {
        this.props.onChange(this.onGeocodeSuggest(suggest))
        this.resetSearchResults()
    }

    onSuggestsLookup(userInput) {
        return Nominatim.geocode({
            q: userInput,
            addressdetails: true,
            extratags: true,
            namedetails: true,
        })
    }

    onGeocodeSuggest(suggest) {
        if (!suggest) return null

        if (suggest.existingLocation) {
            return { ...suggest }

        } else {
            const { shortName } = has(suggest, 'raw') ? formatAddress(suggest.raw) : {}

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
            }
        }
    }

    getSuggestLabel(suggest) {
        return formatAddress(suggest).shortName
    }

}

GeoLookupInputComponent.propTypes = {
    initialValue: PropTypes.object,
    onChange: PropTypes.func,
    readOnly: PropTypes.bool,
    localSearchResults: PropTypes.array,
    searchLocalLocations: PropTypes.func,
    resetLocalSearchResults: PropTypes.func,
}

const selector = formValueSelector('addEvent') // same as form name
const mapStateToProps = (state) => ({ localSearchResults: selector(state, '_locationSearchResults') })

const mapDispatchToProps = (dispatch) => ({
    searchLocalLocations: (text) => (dispatch(actions.searchLocation(text))),
    resetLocalSearchResults: () => (dispatch({ type: LOCATIONS.ACTIONS.SET_LOCATION_SEARCH_RESULTS })),
})

export const AddGeoLookupInput = connect(
    mapStateToProps,
    mapDispatchToProps
)(GeoLookupInputComponent)
