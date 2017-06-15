import React, { PropTypes } from 'react'
import Geolookup from 'react-geolookup'
import * as Nominatim from 'nominatim-browser'
import './style.scss'
import classNames from 'classnames'
import { formatAddress } from '../../utils'
import { get, has } from 'lodash'

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
                inputClassName={classNames('line-input', { 'disabledInput': this.props.readOnly })}
                buttonClassName={classNames({ 'disabledButton': this.props.readOnly }, 'btn btn-default geolookup__button')}
                initialValue={this.props.initialValue.name}
                disableAutoLookup={true}
                onChange={this.handleChange.bind(this)}
                onSuggestSelect={this.onSuggestSelect.bind(this)}
                onSuggestsLookup={this.onSuggestsLookup}
                onGeocodeSuggest={this.onGeocodeSuggest}
                getSuggestLabel={this.getSuggestLabel}
                disabled={this.props.readOnly}
                ignoreTab
            />
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
        this.props.onChange(suggest)
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
