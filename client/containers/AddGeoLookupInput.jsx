import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions'
import Geolookup from 'react-geolookup'
import * as Nominatim from 'nominatim-browser'

/**
* Modal for adding/editing a location with nominatim search
*/
class GeoLookupInput extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <Geolookup
                placeholder='Address, City'
                inputClassName="line-input"
                buttonClassName='btn btn-default geolookup__button'
                initialValue={this.props.initialValue.name}
                disableAutoLookup={true}
                onSuggestSelect={this.onSuggestSelect.bind(this)}
                onSuggestsLookup={this.onSuggestsLookup}
                onGeocodeSuggest={this.onGeocodeSuggest}
                getSuggestLabel={this.getSuggestLabel}
            />
        )
    }

    /**
     * When a suggest got selected
     *    @param  {Object} suggest The suggest
     */
    onSuggestSelect(suggest) {
        this.props.onChange(suggest)
    }

    onSuggestsLookup(userInput) {
        return Nominatim.geocode({
            q: userInput,
            addressdetails: true
        })
    }

    onGeocodeSuggest(suggest) {
        let geocoded = {}
        if (suggest) {
            geocoded.nominatim = suggest.raw || {}
            geocoded.location = {
                lat: suggest.raw ? suggest.raw.lat : '',
                lon: suggest.raw ? suggest.raw.lon : ''
            }
            geocoded.placeId = suggest.placeId
            geocoded.isFixture = suggest.isFixture
            geocoded.label = suggest.raw ? suggest.raw.display_name : ''
        }
        return geocoded
    }

    getSuggestLabel(suggest) {
        return suggest.display_name
    }

}

GeoLookupInput.propTypes = {
    initialValue: PropTypes.object,
    onChange: PropTypes.func,
}

const mapDispatchToProps = (dispatch, ownProps) => ({
    onChange: (suggest) => {
        // save (or get) location from suggestions
        dispatch(actions.saveLocation(suggest))
        .then((newLocation) => {
            ownProps.onChange(newLocation)
        }, (e) => {
            throw new Error('Could not load Google Maps API: ' + e.message)
        })
    }
})

export const AddGeoLookupInput = connect(
    null,
    mapDispatchToProps
)(GeoLookupInput)
