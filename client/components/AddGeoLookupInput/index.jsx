import React, { PropTypes } from 'react'
import Geolookup from 'react-geolookup'
import * as Nominatim from 'nominatim-browser'
import './style.scss'
import classNames from 'classnames'
import { formatAddress } from '../../utils'
import { get, has, isEmpty } from 'lodash'
import TextareaAutosize from 'react-textarea-autosize'
import { AddGeoLookupResultsPopUp } from './AddGeoLookupResultsPopUp'

/**
* Modal for adding/editing a location with nominatim search
*/
class GeoLookupInput extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            searchResults: null,
            searching: false,
        }
    }

    handleInputChange(event) {
        this.refs.geolookup.onInputChange(event.target.value.replace(/(?:\r\n|\r|\n)/g, ' '))
        this.handleChange(event.target.value)
        if (this.state.searchResults) {
            this.resetSearchResults()
        } else if (this.state.searching){
            this.setState({ searching: false })
        }
    }

    handleSearchClick() {
        // Disable button before search
        if (!isEmpty(this.props.initialValue) && this.props.initialValue.name) {
            this.setState({ searching : true })
        }

        this.refs.geolookup.hideSuggests()
        this.refs.geolookup.onButtonClick()
    }

    onSuggestResults(suggests) {
        this.setState({
            searchResults : suggests,
            searching: false,
        })
    }

    resetSearchResults() {
        this.setState({
            searchResults : null,
            searching: false,
        })
    }

    render() {
        return (
            <div className='addgeolookup'>
                <span className='addgeolookup__input-wrapper'><TextareaAutosize
                    className={classNames({ 'disabledInput': this.props.readOnly })}
                    disabled={this.props.readOnly ? 'disabled' : ''}
                    value={get(this.props.initialValue, 'name')}
                    onChange={this.handleInputChange.bind(this)} />
                </span>
                {!this.props.readOnly &&
                    <span><button type='button' className='btn' disabled={this.state.searching}
                        onClick={this.handleSearchClick.bind(this)} >
                            <span>Search</span>
                            {this.state.searching && <div className='spinner'>
                              <div className='dot1' />
                              <div className='dot2' />
                            </div>}
                        </button></span>}
                {get(this.state.searchResults, 'length') > 0 &&
                    <AddGeoLookupResultsPopUp
                        suggests={this.state.searchResults}
                        onCancel={this.resetSearchResults.bind(this)}
                        onChange={this.onSuggestSelect.bind(this)} />
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

    getSuggestLabel(suggest) {
        return formatAddress(suggest).shortName
    }

}

GeoLookupInput.propTypes = {
    initialValue: PropTypes.object,
    onChange: PropTypes.func,
    readOnly: PropTypes.bool,
}

export const AddGeoLookupInput = GeoLookupInput
