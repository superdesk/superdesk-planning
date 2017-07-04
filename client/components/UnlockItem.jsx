import React from 'react'
import ReactDOM from 'react-dom'
import { UserAvatar } from '../components'

export class UnlockItem extends React.Component {
    constructor(props) {
        super(props)
        this.handleClickOutside = this.handleClickOutside.bind(this)
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true)
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true)
    }

    handleClickOutside(event) {
        const domNode = ReactDOM.findDOMNode(this)

        if ((!domNode || !domNode.contains(event.target))) {
            this.props.onCancel()
        }
    }

    unlockItem() {
        this.props.onUnlock()
        this.props.onCancel()
    }

    render() {
        return ( <div className="dropdown__menu">
                    <div className="dropdown__menu-label">Locked by</div>
                    <UserAvatar user={this.props.user} large={true}/>
                    <div className="lock-text">{this.props.user.display_name}</div>
                    {this.props.showUnlock && (<button type='button' className="btn btn--medium" onClick={this.unlockItem.bind(this)}>
                        Unlock
                    </button>)}
                </div> )
    }
}

UnlockItem.propTypes = {
    user: React.PropTypes.object.isRequired,
    showUnlock: React.PropTypes.bool,
    onCancel: React.PropTypes.func,
    onUnlock: React.PropTypes.func,
}
