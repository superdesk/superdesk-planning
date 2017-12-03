import React from 'react';
import PropTypes from 'prop-types';
import DebounceInput from 'react-debounce-input';
import {UserAvatar} from './index';
import {get} from 'lodash';

export class UserSearchList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            filteredUserList: [],
            searchText: '',
            openFilterList: false,
        };

        this.setUserListRef = this.setUserListRef.bind(this);
        this.handleClickToCloseUserList = this.handleClickToCloseUserList.bind(this);
    }

    componentWillMount() {
        this.setState({filteredUserList: this.props.users});
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickToCloseUserList, true);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickToCloseUserList, true);
    }

    handleClickToCloseUserList(event) {
        // Close it if clicked anywhere other than the list items or search area
        if (this.userListRef &&
                !this.userListRef.contains(event.target) &&
                get(event, 'target.placeholder') !== 'Search') {
            this.closeUserList();
        }
    }

    filterUserList(event) {
        const filterText = event.target.value;

        if (!filterText) {
            this.setState({filteredUserList: this.props.users});
            return;
        }

        const filterTextNoCase = filterText.toLowerCase();
        const newUserList = this.state.filteredUserList.filter((user) => (
            user.display_name.toLowerCase().substr(0, filterText.length) === filterTextNoCase ||
                user.display_name.toLowerCase().indexOf(filterTextNoCase) >= 0
        ));

        this.setState({
            filteredUserList: newUserList,
            searchText: filterText,
        });
    }

    onUserChange(newUserId) {
        this.props.input.onChange(newUserId);
        this.setState({
            openFilterList: false,
            searchText: '',
        });
    }

    openUserList() {
        if (!this.state.openFilterList) {
            this.setState({openFilterList: true});
        }
    }

    closeUserList() {
        if (this.state.openFilterList) {
            this.setState({openFilterList: false});
        }
    }

    setUserListRef(refNode) {
        this.userListRef = refNode;
    }

    render() {
        const {value} = this.props.input;
        const userList = this.state.searchText ? this.state.filteredUserList : this.props.users;

        return (
            <div>
                <label className="sd-line-input__label">User</label>
                { value &&
                    <div className="assignmentselect__user">
                        <UserAvatar user={value} />
                        <div className="assignmentselect__label">{value.display_name}</div>
                        <button type="button" onClick={this.onUserChange.bind(this, null)}>
                            <i className="icon-close-small"/>
                        </button>
                    </div> }
                <div className="sd-line-input sd-line-input--label-left sd-line-input--no-margin">
                    <DebounceInput
                        value={this.state.searchText}
                        onClick={this.openUserList.bind(this)}
                        className="sd-line-input__input"
                        minLength={1}
                        debounceTimeout={500}
                        onChange={this.filterUserList.bind(this)}
                        placeholder="Search" />
                </div>
                {this.state.openFilterList &&
                    (<ul className="assignmentselect__list"
                        ref={this.setUserListRef}>
                        {userList.map((user, index) => (
                            <li key={index} className="assignmentselect__item">
                                <button type="button" onClick={this.onUserChange.bind(this, user)}>
                                    <UserAvatar user={user} />
                                    <div className="assignmentselect__label">{user.display_name}</div>
                                </button>
                            </li>
                        ))}
                    </ul>)}
            </div>
        );
    }
}

UserSearchList.propTypes = {
    input: PropTypes.object,
    users: PropTypes.array,
};

UserSearchList.defaultProps = {users: []};
