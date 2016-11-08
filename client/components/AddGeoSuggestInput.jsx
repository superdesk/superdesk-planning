import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions'
import Geosuggest from 'react-geosuggest'
import loadGoogleMapsAPI from 'load-google-maps-api'

/**
* Modal for adding/editing a location with google place autocomplete
*/
export class GeoSuggestInput extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            googleMaps: null
        }
    }

    componentDidMount() {
        let opts = {
            key: this.props.googleApiKey,
            libraries: ['places']
        }
        loadGoogleMapsAPI(opts).then((googleMaps) => {
            this.setState({ googleMaps: googleMaps })
        }).catch((e) => {
            throw new Error('Could not load Google Maps API: ' + e.message)
        })
    }

    render() {
        if (this.state.googleMaps) {
            return (
              <div>
                <Geosuggest
                    googleMaps={this.state.googleMaps}
                    placeholder="Start typing"
                    initialValue={this.props.initialValue.name}
                    onSuggestSelect={this.onSuggestSelect.bind(this)}
                />
              </div>
            )
        } else {
            return (<div></div>)
        }
    }

    /**
     * When a suggest got selected
     *    @param  {Object} suggest The suggest
     */
    onSuggestSelect(suggest) {
        this.props.onChange(suggest)
    }
}

GeoSuggestInput.propTypes = { googleApiKey: PropTypes.string }
GeoSuggestInput.propTypes = { initialValue: PropTypes.string }

const mapStateToProps = (state) => ({
    googleApiKey: state.config.google.key
})

const mapDispatchToProps = (dispatch, ownProps) => ({
    onChange: (suggest) => {
        // save (or get) location from suggesti$a
        dispatch(actions.saveLocation(suggest))
        .then((newLocation) => {
            ownProps.onChange(newLocation)
        }, (e) => {
            throw new Error('Could not load Google Maps API: ' + e.message)
        })
    }
})

export const AddGeoSuggestInput = connect(
    mapStateToProps,
    mapDispatchToProps
)(GeoSuggestInput)
