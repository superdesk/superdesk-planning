import React from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'
import { formatAddress } from '../../utils'

export const EventPreview = ({ item, formProfile }) => {
    // If the item is not defined, or location is not enabled in planning-types then return null
    // (location is the only Event attribute currently shown in the assignment preview)
    if (!item || !get(formProfile, 'editor.location.enabled')) {
        return null
    }

    let location = get(item, 'location[0]', {})
    let locationName = get(location, 'name')
    let formattedAddress = ''

    if (get(location, 'address')) {
        // Location from local locations collection in database
        formattedAddress = formatAddress(location).formattedAddress
    } else if (get(location, 'nominatin.address')) {
        // Location select from lookup suggests
        locationName = get(location, 'nominatim.namedetails.name')
        formattedAddress = formatAddress(location.nominatim).formattedAddress
    }

    return (
        <div className="form__row">
            <label className="form-label form-label--light">
                Location
            </label>
            <span className='addgeolookup__input-wrapper'>
                {locationName}
                <span style={{
                    fontStyle: 'italic',
                    fontSize: 'small',
                }}>
                    <br />
                    {formattedAddress}
                </span>
            </span>
        </div>
    )
}

EventPreview.propTypes = {
    item: PropTypes.object,
    formProfile: PropTypes.object,
}
