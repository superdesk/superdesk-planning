import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions'
import Geosuggest from 'react-geosuggest'

/**
* Modal for adding/editing a location with nominatim search
*/
class GeoSuggestInput extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <Geosuggest
                useNominatim={true}
                placeholder='Address, City'
                inputClassName="line-input"
                buttonClassName='btn btn-default geosuggest__button'
                initialValue={this.props.initialValue.name}
                onSuggestSelect={this.onSuggestSelect.bind(this)}
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
}

GeoSuggestInput.propTypes = {
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

export const AddGeoSuggestInput = connect(
    null,
    mapDispatchToProps
)(GeoSuggestInput)
