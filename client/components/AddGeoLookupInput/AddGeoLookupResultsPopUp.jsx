import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom'
import { formatAddress } from '../../utils'
import './style.scss'

export class AddGeoLookupResultsPopUp extends React.Component {
    constructor(props) {
        super(props)
        this.handleClickOutside = this.handleClickOutside.bind(this)
    }

    handleClickOutside(event) {
        const domNode = ReactDOM.findDOMNode(this)

        if ((!domNode || !domNode.contains(event.target))) {
            this.props.onCancel()
        }
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true)
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true)
    }

    render() {
        return (<div className='addgeolookup__suggests-wrapper'>
            <ul className='addgeolookup__suggests'>
                {this.props.suggests.map((suggest, index) => {
                    const shortName = formatAddress(suggest.raw).shortName
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
    onCancel: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
}

