import React from 'react'
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
            //'client': '585254746787-r2e7020r522g9k2ole9s5g8djre2rdal.apps.googleusercontent.com',
            //'key': 'AIzaSyCuGlrZ298m7QL1TIVYsoYN6MqygSXPjRk',
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
            console.log('MAPS', this.state.googleMaps)
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

