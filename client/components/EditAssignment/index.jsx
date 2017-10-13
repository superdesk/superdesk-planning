import React from 'react'
import PropTypes from 'prop-types'
import { AssignmentSelect } from './AssignmentSelect'
import { UserAvatar } from '../'
import { get } from 'lodash'
import './style.scss'

export class EditAssignment  extends React.Component {
    constructor(props) {
        super(props)

        this.state = { openAssignmentSelect: false }
        this.unAssign = this.unAssign.bind(this)
        this.toggleSelection = this.toggleSelection.bind(this)
        this.onChange = this.onChange.bind(this)
    }

    toggleSelection() {
        this.setState({ openAssignmentSelect: !this.state.openAssignmentSelect })
    }

    unAssign() {
        this.props.input.onChange({
            ...this.props.input.value,
            desk: null,
            user: null,
        })
    }

    getAssignedDesk() {
        if (!this.props.input.value || !this.props.input.value.desk) {
            return
        }

        return this.props.desks.find((desk) => desk._id === this.props.input.value.desk)
    }

    getAssignedUser() {
        if (!this.props.input.value || !this.props.input.value.user) {
            return
        }

        return this.props.users.find((user) =>
            user._id === this.props.input.value.user)
    }

    getAvatarClassNames(deskAssigned, userAssigned) {
        if (!deskAssigned && !userAssigned) {
            return 'unassigned'
        }

        if (deskAssigned && userAssigned) {
            return 'initials'
        }

        return deskAssigned ? 'desk' : 'initials'
    }

    onChange(value, toggle=true) {
        this.props.input.onChange({
            ...this.props.input.value,
            desk: get(value, 'desk._id'),
            user: get(value, 'user._id'),
            coverage_provider: get(value, 'coverage_provider'),
        })

        if (toggle) {
            this.toggleSelection()
        }
    }

    render() {
        const deskAssigned = this.getAssignedDesk()
        const userAssigned = this.getAssignedUser()
        const { context } = this.props
        const coverageProvider = get(this.props, 'input.value.coverage_provider')
        let avatarClassNames = this.getAvatarClassNames(deskAssigned, userAssigned)

        const assignmentSelectInput = {
            onChange: this.onChange,
            value: {
                deskAssigned: deskAssigned,
                userAssigned: userAssigned,
                coverage_provider: coverageProvider,
            },
        }

        const renderAction = (buttonText, callback) => (
            <button
                className='assignment__action pull-right'
                type='button'
                onClick={callback}>
                <a>{buttonText}</a>
            </button>
        )

        const renderUserAvatar = () => (
            <div>
                { userAssigned && <UserAvatar user={userAssigned} large={true} /> }
                { !userAssigned && deskAssigned && <figure className={avatarClassNames + ' avatar large'} /> }
                { !deskAssigned && !userAssigned && <label>Unassigned</label> }
                { deskAssigned && <label>{'Desk: ' + deskAssigned.name}</label> }
                { userAssigned && <label>{userAssigned.display_name}</label> }
                { coverageProvider && <label> {'Coverage Provider: ' + coverageProvider.name} </label>}
            </div>
        )

        const renderCoverageActions = () => {
            return (
                <div className='assignment'>
                    { renderUserAvatar() }
                    { !this.props.readOnly && !get(this.props, 'input.value.assignment_id') &&
                    renderAction('Create Assignment', this.toggleSelection) }
                </div>
            )
        }

        const renderAssignmentActions = () => {
            return (
                <div className='assignment'>
                    { renderUserAvatar() }
                    { !this.props.readOnly && renderAction('Reassign', this.toggleSelection) }
                </div>
            )
        }

        return (
            <div className='field'>
                { context === 'coverage'  && renderCoverageActions() }
                { context === 'assignment' && renderAssignmentActions() }
                {
                    this.state.openAssignmentSelect &&
                    (<AssignmentSelect
                        users={this.props.users}
                        desks={this.props.desks}
                        onCancel={this.toggleSelection}
                        coverageProviders={this.props.coverageProviders}
                        input={assignmentSelectInput} context={context} />)
                }
            </div>
        )
    }
}

EditAssignment.propTypes = {
    users: PropTypes.array.isRequired,
    coverageProviders: PropTypes.array,
    desks: PropTypes.array.isRequired,
    input: PropTypes.object,
    readOnly: PropTypes.bool,
    context: PropTypes.oneOf(['coverage','assignment']).isRequired,
}

EditAssignment.defaultValues = { context: 'coverage' }
