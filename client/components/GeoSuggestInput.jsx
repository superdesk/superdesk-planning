import React, { PropTypes } from 'react'
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
    }

    render() {
        if (this.state.googleMaps) {
            return (
              <div>
                <Geosuggest
                    googleMaps={this.state.googleMaps}
                    placeholder="Start typing"
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
        console.log(suggest)
    }
}
GeoSuggestInput.propTypes = { googleApiKey: PropTypes.string } 
