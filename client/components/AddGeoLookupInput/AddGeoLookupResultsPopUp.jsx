import React, { PropTypes } from 'react'
import { formatAddress } from '../../utils'
import { get } from 'lodash'
import './style.scss'

export class AddGeoLookupResultsPopUp extends React.Component {
    constructor(props) {
        super(props)
        this.state = { searching: false }
    }

    componentWillReceiveProps() {
        this.setState({ searching: false })
    }

    onSearchClick() {
        this.setState({ searching: true })
        this.props.handleSearchClick()
    }

    render() {
        const localSuggests = get(this.props.localSuggests, 'length') > 0 ?
                            this.props.localSuggests : []
        const suggests = get(this.props.suggests, 'length') > 0 ?
                            this.props.suggests : []

        return (<div className='addgeolookup__suggests-wrapper'>
            <ul className='addgeolookup__suggests'>
                {localSuggests.map((suggest, index) => {
                    const shortName = suggest.existingLocation ? suggest.name: formatAddress(suggest.raw).shortName
                    return (<li key={index} className='addgeolookup__item'
                                onClick={this.props.onChange.bind(null, suggest)}>
                            <span>&nbsp;&nbsp;{shortName}</span>
                    </li>)
                })}
                {this.props.showExternalSearch && <li>
                    <button type='button' className='btn' disabled={this.state.searching}
                        onClick={this.onSearchClick.bind(this)} style={{ width: '100%' }}>
                        <span>Search external</span>
                        {this.state.searching && <div className='spinner'>
                          <div className='dot1' />
                          <div className='dot2' />
                        </div>}
                    </button>
                </li>}
                {suggests.map((suggest, index) => {
                    const shortName = suggest.existingLocation ? suggest.name: formatAddress(suggest.raw).shortName
                    return (<li key={index} className='addgeolookup__item'
                                onClick={this.props.onChange.bind(null, suggest)}>
                            <span>&nbsp;&nbsp;{shortName}</span>
                    </li>)
                })}
            </ul>
        </div>)
    }
}

AddGeoLookupResultsPopUp.propTypes = {
    suggests: PropTypes.array,
    localSuggests: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    handleSearchClick: PropTypes.func,
    showExternalSearch: PropTypes.bool,
}

