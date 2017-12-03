import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {UserAvatar} from '../components';

export class UnlockItem extends React.Component {
    constructor(props) {
        super(props);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.unlockItem = this.unlockItem.bind(this);
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true);
    }

    handleClickOutside(event) {
        const domNode = ReactDOM.findDOMNode(this);

        if ((!domNode || !domNode.contains(event.target))) {
            this.props.onCancel();
        }
    }

    unlockItem() {
        this.props.onUnlock();
        this.props.onCancel();
    }

    render() {
        const {
            displayText,
            user,
            showUnlock,
        } = this.props;

        return (
            <div className="dropdown__menu">
                <div className="dropdown__menu-label">{displayText || 'Locked By:'}</div>
                <UserAvatar user={user} large={true} />
                <div className="lock-text">{user.display_name}</div>
                {showUnlock &&
                    <button type="button" className="btn btn--medium" onClick={this.unlockItem}>
                        Unlock
                    </button>
                }
            </div>
        );
    }
}

UnlockItem.propTypes = {
    user: PropTypes.object.isRequired,
    showUnlock: PropTypes.bool,
    onCancel: PropTypes.func,
    onUnlock: PropTypes.func,
    displayText: PropTypes.string,
};

UnlockItem.defaultProps = {displayText: 'Locked by:'};