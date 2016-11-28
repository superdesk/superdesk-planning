import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions'
import Geosuggest from 'react-geosuggest'

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
    }

    render() {
        if (this.state.googleMaps) {
            return (
              <div>
                <Geosuggest
                    googleMaps={this.state.googleMaps}
                    useNominatim={true}
                    placeholder='Address, City'
                    buttonClassName='btn btn-default geosuggest__button'
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
GeoSuggestInput.propTypes = { initialValue: PropTypes.object }

const mapStateToProps = (state) => ({
    googleApiKey: state.config.google ? state.config.google.key : ''
})

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
    mapStateToProps,
    mapDispatchToProps
)(GeoSuggestInput)
