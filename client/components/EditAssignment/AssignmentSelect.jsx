import React from 'react'
import PropTypes from 'prop-types'
import { SearchBar } from '../../components'
import { ASSIGNMENTS } from '../../constants'
import { fields } from '../index'
import ReactDOM from 'react-dom'
import { UserAvatar } from '../'
import { map, get } from 'lodash'
import classNames from 'classnames'
import './style.scss'

export class AssignmentSelect extends React.Component {
    constructor(props) {
        super(props)
        this.handleClickOutside = this.handleClickOutside.bind(this)
    }

    filterUsers(deskAssigned) {
        if (!deskAssigned) return this.props.users

        let filteredUsers = this.props.users.filter((user) =>
            map(deskAssigned.members, 'user').indexOf(user._id) !== -1)

        return filteredUsers
    }

    isComponentPristine() {
        return get(this.props, 'input.value.deskAssigned') === this.state.deskAssigned &&
            get(this.props, 'input.value.userAssigned') === this.state.userAssigned &&
            get(this.props, 'input.value.coverage_provider.qcode') ===
                get(this.state.coverageProviderAssigned, 'qcode')
    }

    filterDesks(userAssigned) {
        if (!userAssigned) return this.props.desks

        // If user assigned is a provider, show all desks
        const selectedUser = this.props.users.find((u) =>
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
            coverageProviderAssigned: this.props.input.value.coverage_provider,
            priority: get(this.props.input, 'value.priority') || ASSIGNMENTS.DEFAULT_PRIORITY,
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


    onCoverageProviderChange(value) {
        this.setState({
            coverageProviderAssigned: this.props.coverageProviders.find((p) => p.qcode === value) ||
            null,
        })
    }

    onUserAssignChange(value) {
        // Change desk list to user's desks
        this.setState({
            filteredDeskList: this.filterDesks(value),
            userAssigned: this.props.users.find((user) =>
                user._id === value),
        })
        this.refs.searchBar.resetSearch()
    }

    onChange(value) {
        this.props.input.onChange({
            user: value.user,
            desk: value.desk,
            coverage_provider: value.coverage_provider,
            priority: this.state.priority,
        })
    }

    onPriorityChange(value) {
        this.setState({ priority: value })

    }

    render() {
        const deskSelectFieldInput = {
            value: this.state.deskAssigned,
            onChange: this.onDeskAssignChange.bind(this),
        }

        const coverageProviderSelectFieldInput = {
            value: this.state.coverageProviderAssigned,
            onChange: this.onCoverageProviderChange.bind(this),
        }

        const assignmentPriorityInput = {
            value: this.state.priority,
            onChange: this.onPriorityChange.bind(this),
        }

        const { context } = this.props
        const classes = classNames('assignmentselect',
            { 'assignmentselect--in-assignment': context === 'assignment' },
            { 'assignmentselect--in-coverage': context === 'coverage' })

        return (<div className={classes}>
            { <label>Assignment Details</label> || <label>Select</label>}
            { (this.state.coverageProviderAssigned || this.state.userAssigned) && !this.state.deskAssigned &&
                        <span className="error-block">Must select a desk.</span> }

            <label>Desk</label>
            <fields.DeskSelectField
                desks={this.state.filteredDeskList}
                autoFocus={true}
                input={deskSelectFieldInput}
                readOnly={this.props.deskSelectionDisabled} />
            <div>
            <div>
                <label>Coverage Provider</label>
                <fields.CoverageProviderField
                coverageProviders={this.props.coverageProviders}
                input={coverageProviderSelectFieldInput}/>
            </div>
            </div>
            <label>User</label>
            { this.state.userAssigned &&
                <div className='assignmentselect__user'>
                    <UserAvatar user={this.state.userAssigned} />
                    <div className='assignmentselect__label'>{this.state.userAssigned.display_name}</div>
                    <button type='button' onClick={this.onUserAssignChange.bind(this, null)}>
                        <i className="icon-close-small"/>
                    </button>
                </div> }
            { this.state.filteredUserList.length > 0 && <div className='assignmentselect__search'>
                <SearchBar onSearch={(value) => {this.filterUserList(value)}} minLength={1}
                    extendOnOpen={false} ref='searchBar'/>
            </div> }
            <ul className='assignmentselect__list'>
                {this.state.filteredUserList.map((user, index) => (
                    <li key={index} className='assignmentselect__item'>
                        <button type='button' onClick={this.onUserAssignChange.bind(this, user._id)}>
                            <UserAvatar user={user} />
                            <div className='assignmentselect__label'>{user.display_name}</div>
                        </button>
                    </li>
                ))}
            </ul>

            {this.props.showPrioritiesSelection &&
            <div className='assignmentselect__priority'>
                <fields.AssignmentPriorityField
                    label="Assignment Priority"
                    input={assignmentPriorityInput}
                    readOnly={false} />
            </div>}

            <div className='assignmentselect__action'>
                { this.state.deskAssigned &&
                <button type="button" className="btn btn--primary"
                    disabled={this.isComponentPristine()}
                    onClick={this.onChange.bind(this, {
                        user: this.state.userAssigned,
                        desk: this.state.deskAssigned,
                        coverage_provider: this.state.coverageProviderAssigned,
                    })}>
                    Confirm
                </button>}
                <button type="button" className="btn" onClick={this.props.onCancel}>
                    Cancel
                </button>
            </div>
        </div>)
    }
}

AssignmentSelect.propTypes = {
    users: PropTypes.array.isRequired,
    coverageProviders: PropTypes.array,
    desks: PropTypes.array.isRequired,
    onCancel: PropTypes.func.isRequired,
    input: PropTypes.object.isRequired,
    context: PropTypes.string,
    deskSelectionDisabled: PropTypes.bool,
    showPrioritiesSelection: PropTypes.bool,
}
