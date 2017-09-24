import React from 'react'
import { SearchBar } from '../../components'
import { fields } from '../index'
import ReactDOM from 'react-dom'
import { UserAvatar } from '../'
import { map, get } from 'lodash'
import './style.scss'

export class CoverageAssignSelect extends React.Component {
    constructor(props) {
        super(props)
        this.handleClickOutside = this.handleClickOutside.bind(this)
    }

    filterUsers(deskAssigned) {
        if (!deskAssigned) return this.props.usersMergedCoverageProviders

        let filteredUsersWithProviders = this.props.usersMergedCoverageProviders.filter((user) =>
            map(deskAssigned.members, 'user').indexOf(user._id) !== -1)

        // Append providers as they belong to all desks
        const providers = this.props.usersMergedCoverageProviders.filter((u) => u.provider)
        filteredUsersWithProviders = [
            ...filteredUsersWithProviders,
            ...providers,
        ]

        return filteredUsersWithProviders
    }

    filterDesks(userAssigned) {
        if (!userAssigned) return this.props.desks

        // If user assigned is a provider, show all desks
        const selectedUser = this.props.usersMergedCoverageProviders.find((u) =>
            u._id === userAssigned)
        if (selectedUser.provider) {
            return this.props.desks
        }

        return this.props.desks.filter((desk) =>
            map(desk.members, 'user').indexOf(userAssigned) !== -1)
    }

    componentWillMount() {
        this.setState({
            filteredUserList: this.filterUsers(this.props.input.value.deskAssigned),
            filteredDeskList: this.filterDesks(get(this.props.input.value.userAssigned, '_id')),
            userAssigned: this.props.input.value.userAssigned,
            deskAssigned: this.props.input.value.deskAssigned,
        })
    }

    filterUserList(value) {
        if (!value) {
            this.setState({ filteredUserList: this.filterUsers(this.state.deskAssigned) })
            return
        }

        const valueNoCase = value.toLowerCase()
        const newUserList = this.state.filteredUserList.filter((user) => (
            user.display_name.toLowerCase().substr(0, value.length) === valueNoCase ||
                user.display_name.toLowerCase().indexOf(valueNoCase) >= 0
        ))

        this.setState({ filteredUserList: newUserList })
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

    onDeskAssignChange(value) {
        // Change user list according to desk members
        const updatedValue = Array.isArray(value) ? null : value
        this.setState({
            filteredUserList: this.filterUsers(updatedValue),
            deskAssigned: updatedValue,
        })
    }

    onUserAssignChange(value) {
        // Change desk list to user's desks
        this.setState({
            filteredDeskList: this.filterDesks(value),
            userAssigned: this.props.usersMergedCoverageProviders.find((user) =>
                user._id === value),
        })
        this.refs.searchBar.resetSearch()
    }

    onChange(value) {
        this.props.input.onChange({
            user: value.user,
            desk: value.desk,
        })
    }

    render() {
        const deskSelectFieldInput = {
            value: this.state.deskAssigned,
            onChange: this.onDeskAssignChange.bind(this),
        }

        return (<div className='coverageassignselect'>
            <label>Assign</label>
            { this.state.userAssigned && !this.state.deskAssigned &&
                        <span className="error-block">Must select a desk.</span> }
            <fields.DeskSelectField
                desks={this.state.filteredDeskList}
                autoFocus={true}
                input={deskSelectFieldInput} />
            { this.state.userAssigned &&
                <div className='coverageassignselect__user'>
                    <UserAvatar user={this.state.userAssigned} />
                    <div className='coverageassignselect__label'>{this.state.userAssigned.display_name}</div>
                    <button type='button' onClick={this.onUserAssignChange.bind(this, null)}>
                        <i className="icon-close-small"/>
                    </button>
                </div> }
            { this.state.filteredUserList.length > 0 && <div className='coverageassignselect__search'>
                <SearchBar onSearch={(value) => {this.filterUserList(value)}} minLength={1}
                    extendOnOpen={false} ref='searchBar'/>
            </div> }
            <ul className='coverageassignselect__list'>
                {this.state.filteredUserList.map((user, index) => (
                    <li key={index} className='coverageassignselect__item'>
                        <button type='button' onClick={this.onUserAssignChange.bind(this, user._id)}>
                            <UserAvatar user={user} />
                            <div className='coverageassignselect__label'>{user.display_name}</div>
                        </button>
                    </li>
                ))}
            </ul>
            <div className='coverageassignselect__action'>
                { this.state.deskAssigned && <button type="button" className="btn btn--primary"
                    onClick={this.onChange.bind(this, {
                        user: this.state.userAssigned,
                        desk: this.state.deskAssigned,
                    })}>
                    Save
                </button>}
                <button type="button" className="btn" onClick={this.props.onCancel}>
                    Cancel
                </button>
            </div>
        </div>)
    }
}

CoverageAssignSelect.propTypes = {
    usersMergedCoverageProviders: React.PropTypes.array.isRequired,
    desks: React.PropTypes.array.isRequired,
    onCancel: React.PropTypes.func.isRequired,
    input: React.PropTypes.object.isRequired,
}
