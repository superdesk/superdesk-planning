import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

import {KEYCODES} from '../../../../constants';
import {gettext, uiUtils, onEventCapture} from '../../../../utils';

import {Popup, Content} from '../../Popup';
import {UserAvatar} from '../../../';

import './style.scss';

export class SelectUserPopup extends React.Component {
    constructor(props) {
        super(props);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.handleOnChange = this.handleOnChange.bind(this);
        this.state = {activeIndex: -1};
        this.dom = {itemList: null};
    }

    onKeyDown(event) {
        if (event) {
            switch (event.keyCode) {
            case KEYCODES.ENTER:
                onEventCapture(event);
                this.handleEnterKey(event);
                break;
            case KEYCODES.DOWN:
                onEventCapture(event);
                this.handleDownArrowKey(event);
                break;
            case KEYCODES.UP:
                onEventCapture(event);
                this.handleUpArrowKey(event);
                break;
            }
        }
    }

    handleEnterKey(event) {
        this.props.onChange(this.props.users[this.state.activeIndex]);
    }

    handleDownArrowKey(event) {
        if (get(this.props, 'users.length', 0) - 1 > this.state.activeIndex) {
            this.setState({activeIndex: this.state.activeIndex + 1});
            uiUtils.scrollListItemIfNeeded(this.state.activeIndex, this.dom.itemList);
        }
    }

    handleUpArrowKey(event) {
        if (this.state.activeIndex > 0) {
            this.setState({activeIndex: this.state.activeIndex - 1});
            uiUtils.scrollListItemIfNeeded(this.state.activeIndex, this.dom.itemList);
        }
    }

    handleOnChange(user, event) {
        onEventCapture(event);
        this.props.onChange(user);
    }

    render() {
        const {
            onClose,
            target,
            popupContainer,
            users,
        } = this.props;

        return (
            <Popup
                close={onClose}
                target={target}
                popupContainer={popupContainer}
                className="user-search__popup"
                noPadding={true}
                onKeyDown={this.onKeyDown}
                inheritWidth={true}
            >
                <Content noPadding={true}>
                    <ul className="user-search__popup-list"
                        ref={(ref) => this.dom.itemList = ref}>
                        {users.length > 0 && users.map((user, index) => (
                            <li key={index} className={
                                classNames('user-search__popup-item',
                                    {'user-search__popup-item--active': index === this.state.activeIndex})}>
                                <button type="button" onClick={this.handleOnChange.bind(null, user)}>
                                    <UserAvatar user={user} />
                                    <div className="user-search__popup-item-label">{user.display_name}</div>
                                </button>
                            </li>
                        ))}

                        {users.length === 0 && (
                            <li className="user-search__popup-item">
                                <button disabled>
                                    <UserAvatar empty={true} initials={false}/>
                                    <div className="user-search__popup-item-label">{gettext('No users found')}</div>
                                </button>
                            </li>
                        )}
                    </ul>
                </Content>
            </Popup>
        );
    }
}

SelectUserPopup.propTypes = {
    onClose: PropTypes.func,
    target: PropTypes.string,
    popupContainer: PropTypes.func,
    users: PropTypes.array,
    onChange: PropTypes.func,
};
