import React from 'react'
import PropTypes from 'prop-types'
import { UserSearchList } from '../../components'
import { getUsersForDesk, getDesksForUser } from '../../utils'
import { ASSIGNMENTS } from '../../constants'
import { fields } from '../index'
import ReactDOM from 'react-dom'
import { get } from 'lodash'
import classNames from 'classnames'
import './style.scss'

export class AssignmentSelect extends React.Component {
    constructor(props) {
        super(props)
        this.handleClickOutside = this.handleClickOutside.bind(this)
    }

    isComponentPristine() {
        return get(this.props, 'input.value.deskAssigned') === this.state.deskAssigned &&
            get(this.props, 'input.value.userAssigned') === this.state.userAssigned &&
            get(this.props, 'input.value.coverage_provider.qcode') ===
                get(this.state.coverageProviderAssigned, 'qcode')
    }

    componentWillMount() {
        this.setState({
            filteredUserList: getUsersForDesk(this.props.input.value.deskAssigned,
                this.props.users),
            filteredDeskList: getDesksForUser(get(this.props.input.value.userAssigned, '_id'),
                this.props.desks),
            userAssigned: this.props.input.value.userAssigned,
            deskAssigned: this.props.input.value.deskAssigned,
            coverageProviderAssigned: this.props.input.value.coverage_provider,
            priority: get(this.props.input, 'value.priority') || ASSIGNMENTS.DEFAULT_PRIORITY,
        })
    }

    filterUserList(value) {
        if (!value) {
            this.setState({
                filteredUserList: getUsersForDesk(this.state.deskAssigned,
                    this.props.users),
                })
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
            filteredUserList: getUsersForDesk(updatedValue, this.props.users),
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
            filteredDeskList: getDesksForUser(value, this.props.desks),
            userAssigned: value,
        })
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

        const userSearchListInput = {
            value: this.state.userAssigned,
            onChange: this.onUserAssignChange.bind(this),
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

            <UserSearchList
                input = {userSearchListInput}
                users = {this.state.filteredUserList} />

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
