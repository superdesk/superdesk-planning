import React from 'react'
import { CoverageAssignSelect } from './CoverageAssignSelect'
import './style.scss'

export class CoverageAssign  extends React.Component {
    constructor(props) {
        super(props)

        this.state = { openCoverageAssignSelect: false }
    }

    toggleCoverageAssignSelect() {
        this.setState({ openCoverageAssignSelect: !this.state.openCoverageAssignSelect })
    }

    selectUserAssignee(value) {
        this.props.input.onChange({ user: value })
    }

    selectDeskAssignee(value) {
        this.props.input.onChange({ desk: value })
    }

    unassignAssignment() {
        this.props.input.onChange({
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

        return this.props.users.find((user) => user._id === this.props.input.value.user)
    }

    getAvatar(deskAssigned, userAssigned) {
        if (!deskAssigned && !userAssigned) {
            return 'unassigned'
        }

        if (deskAssigned && userAssigned) {
            return 'initials coverageassign__initials'
        }

        return deskAssigned ? 'desk' : 'initials coverageassign__initials'
    }

    render() {
        const deskAssigned = this.getAssignedDesk()
        const userAssigned = this.getAssignedUser()
        let avatar = this.getAvatar(deskAssigned, userAssigned)

        return (
            <div className='field'>
                <div className='coverageassign'>
                    <figure className={avatar + ' avatar large'}>
                    {
                        avatar.indexOf('initials') >= 0 &&
                        (<span>{userAssigned.display_name.replace(/\W*(\w)\w*/g, '$1').toUpperCase()}</span>)
                    }
                    </figure>
                    { (!deskAssigned && !userAssigned && <label>Unassigned</label>) ||
                      (deskAssigned && <label>{'Desk: ' + deskAssigned.name}</label>) ||
                      (userAssigned && <label>{userAssigned.display_name}</label>) }
                    { !this.props.readOnly && <button className='coverageassign__action pull-right' type='button'
                        onClick={this.unassignAssignment.bind(this)}>
                        <a>Unassign</a>
                        </button>
                    }
                    { !this.props.readOnly && <button className='coverageassign__action pull-right' type='button'
                        onClick={this.toggleCoverageAssignSelect.bind(this)}>
                        <a>Assign</a>
                        </button>
                    }
                    {
                        this.state.openCoverageAssignSelect &&
                        (<CoverageAssignSelect users={this.props.users} desks={this.props.desks} onCancel={this.toggleCoverageAssignSelect.bind(this)}
                            onDeskAssignChange={this.selectDeskAssignee.bind(this)}
                            onUserAssignChange={this.selectUserAssignee.bind(this)} />)
                    }
                </div>
            </div>
        )
    }
}

CoverageAssign.propTypes = {
    users: React.PropTypes.array.isRequired,
    desks: React.PropTypes.array.isRequired,
    input: React.PropTypes.object,
    readOnly: React.PropTypes.bool,
}
