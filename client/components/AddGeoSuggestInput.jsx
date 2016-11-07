import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions'
import ReactDOM from 'react-dom'
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
            'key': this.props.googleApiKey,
            'libraries': [
                'places'
            ]
        }
        loadGoogleMapsAPI(opts).then((googleMaps) => { 
            this.setState({
                googleMaps: googleMaps
            })
        }).catch((err) => {
            console.error('COULD NOT LOAD GOOGLE MAPS API', err)
        })

        // TODO: load fixtures (internal locations) to set in Geosuggest
        // render function below, to ensure we do not attempt to re-save
        // existing locations
    }

    render() {
        if (this.state.googleMaps) {
            return (
              <div>
                <Geosuggest
                    googleMaps={this.state.googleMaps}
                    placeholder="Start typing"
                    initialValue={this.props.initialValue}
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

const mapDispatchToProps = (dispatch) => ({
    onChange: (suggest) => {
        // save (or get) location from suggesti$a
        dispatch(actions.saveLocation(suggest))
        .then((newLocation) => {
            console.log('NEW LOCATION', newLocation)
        }, (error) => {
            console.log('ERROR', error)
        })
    }
})

export const AddGeoSuggestInput = connect(undefined, mapDispatchToProps, null, { withRef: true })(GeoSuggestInput)
