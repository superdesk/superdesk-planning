import React from 'react'
import PropTypes from 'prop-types'
import { get, isEqual } from 'lodash'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { Field, reduxForm, formValueSelector } from 'redux-form'
import * as actions from '../../../actions'
import * as selectors from '../../../selectors'
import { fields, AbsoluteDate, UserSearchList } from '../../../components'
import { getItemInArrayById, getUsersForDesk, getDesksForUser, assignmentUtils } from '../../../utils'
import '../style.scss'
import { FORM_NAMES, ASSIGNMENTS, TOOLTIPS } from '../../../constants'
import { ChainValidators, RequiredFieldsValidatorFactory } from '../../../validators'

class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            filteredDesks: [],
            filteredUsers: [],
            deskAssigned: null,
            userAssigned: null,
            coverageProviderAssigned: null,
        }
    }

    componentWillMount() {
        const {
            desks,
            users,
            initialValues,
        } = this.props

        const deskAssigned = get(initialValues, 'assigned_to.desk._id') ? initialValues.assigned_to.desk :
            getItemInArrayById(desks, initialValues.assigned_to.desk)
        const userAssigned = getItemInArrayById(users, initialValues.assigned_to.user)

        this.setState({
            filteredDesks: getDesksForUser(userAssigned, desks),
            filteredUsers: getUsersForDesk(deskAssigned, users) ,
            deskAssigned: deskAssigned,
            userAssigned: userAssigned,
            coverageProviderAssigned: get(initialValues, 'assigned_to.coverage_provider'),
        })
    }

    componentWillReceiveProps(nextProps) {
        // If desk selection changed
        if (!isEqual(nextProps.currentDesk, this.props.currentDesk)) {
            // Desk assigned can take 3 values
            // 1 - null when nothing is selected
            // 2 - desk._id when it is being loaded as backend stores it as _id
            // 3 - desk object when a desk is selected from dropdown

            let deskAssigned
            if (get(nextProps, 'currentDesk._id')) {
                deskAssigned = nextProps.currentDesk
            } else if (nextProps.currentDesk) {
                deskAssigned = getItemInArrayById(this.props.desks, nextProps.currentDesk)
            }

            this.setState({ filteredUsers: getUsersForDesk(deskAssigned, this.props.users) })
        }
    }

    getDetailsForEditPriority() {
        const { initialValues } = this.props
        const coverageProvider = get(initialValues, 'assigned_to.coverage_provider')

        let metaData = [
            {
                key: 'Slugline:',
                value: (
                    <span className='ItemActionConfirmation__metadata__slugline'>
                        { initialValues.planning.slugline }
                    </span>
                ),
            },
            {
                key: 'Desk:',
                value: this.state.deskAssigned.name,
            },
        ]

        if (this.state.userAssigned) {
            metaData.push({
                key: 'User:',
                value: this.state.userAssigned.display_name,
            })
        }

        if (coverageProvider) {
            metaData.push({
                key: 'Coverage Provider:',
                value: coverageProvider.name,
            })
        }

        metaData.push({
            key: 'Due:',
            value: (
                <AbsoluteDate
                    date={get(initialValues, 'planning.scheduled', '').toString()}
                    noDateString="'not scheduled yet'"
                />),
        })

        return (
            <div>
                {metaData.map((data) => (
                    <div key={data.key} className="form__row sd-line-input sd-line-input--label-left ItemActionConfirmation__metadata__dataRow">
                        <label className='sd-line-input__label sd-line-input--label-left--noMaxWdth'>{data.key}</label>
                        <label className='sd-line-input__label sd-line-input--label-left--noMaxWdth'>
                            {data.value}
                        </label>
                    </div>
                ))}
            </div>
        )
    }

    getDetailsForReassignment() {
        const { initialValues } = this.props

        let metaData = [
            {
                key: 'Slugline:',
                value: (
                    <span className='ItemActionConfirmation__metadata__slugline'>
                        { initialValues.planning.slugline }
                    </span>),
            },
            {
                key: 'Priority:',
                value: (
                    <span className={
                        classNames('line-input',
                        'priority-label',
                        'priority-label--' + initialValues.priority)
                    }
                    data-sd-tooltip={TOOLTIPS.assignmentPriority[initialValues.priority]} data-flow='down'
                    >{initialValues.priority}</span>),
            },
            {
            key: 'Due:',
            value: (
                <AbsoluteDate
                    date={get(initialValues, 'planning.scheduled', '').toString()}
                    noDateString="'not scheduled yet'"
                />),
            },
        ]

        if (!assignmentUtils.canEditDesk(initialValues)) {
            metaData.push({
                key: 'Desk',
                value: this.state.deskAssigned.name,
            })
        }

        return (
            <div>
                {metaData.map((data) => (
                    <div key={data.key} className="form__row sd-line-input sd-line-input--label-left ItemActionConfirmation__metadata__dataRow">
                        <label className='sd-line-input__label sd-line-input--label-left--noMaxWdth'>{data.key}</label>
                        <label className='sd-line-input__label sd-line-input--label-left--noMaxWdth'>
                            {data.value}
                        </label>
                    </div>
                ))}
            </div>
        )
    }

    getAssignmentDetails() {
        return (
            <div>
                { this.props.initialValues.lock_action === 'edit_priority' &&
                    this.getDetailsForEditPriority() }
                { this.props.initialValues.lock_action === 'reassign' &&
                    this.getDetailsForReassignment() }
            </div>
        )
    }

    getActionsForEditPriority() {
        return (
            <div className='sd-line-input sd-line-input--label-left sd-line-input--no-margin'>
                <div className='form__row'>
                    <Field
                        label='Assignment Priority'
                        name='priority'
                        component={fields.AssignmentPriorityField}
                        readOnly={false} />
                </div>
            </div>
            )

    }

    onDeskChange(newDesk) {
        // Filter users
        this.setState({
            filteredUsers: getUsersForDesk(newDesk, this.props.users),
            deskAssigned: newDesk,
        })

        this.props.change('assigned_to.desk', newDesk._id || null)
    }

    onUserChange(newUser) {
        // Filter desks
        this.setState({
            filteredDesks: getDesksForUser(newUser, this.props.desks),
            userAssigned: newUser,
        })

        this.props.change('assigned_to.user', get(newUser, '_id'))

    }

    onCoverageProviderChange(value) {
        const coverageProviderAssigned = this.props.coverageProviders.find((p) => p.qcode === value) ||
            null

        this.setState({ coverageProviderAssigned: coverageProviderAssigned })
        this.props.change('assigned_to.coverage_provider', coverageProviderAssigned)
    }

    getActionsForReassignment() {
        const userSearchListInput = {
            value: this.state.userAssigned,
            onChange: this.onUserChange.bind(this),
        }
        const coverageProviderSelectFieldInput = {
            value: this.state.coverageProviderAssigned,
            onChange: this.onCoverageProviderChange.bind(this),
        }

        return (
            <div>
                {assignmentUtils.canEditDesk(this.props.initialValues) && <div className='form__row'>
                    <Field
                        name='assigned_to.desk'
                        label='Desk'
                        component={fields.DeskSelectField}
                        desks={this.state.filteredDesks}
                        readOnly={false}
                        required={true} />
                </div>}
                <div className='form__row sd-line-input sd-line-input--label-left'>
                    <label className='sd-line-input__label'>Coverage Provider</label>
                    <fields.CoverageProviderField
                        coverageProviders={this.props.coverageProviders}
                        input={coverageProviderSelectFieldInput}/>
                </div>
                <UserSearchList
                    input = {userSearchListInput}
                    users = {this.state.filteredUsers} />
            </div>
        )
    }

    getAssignmentActions() {
        return (
            <div>
            {this.props.initialValues.lock_action === 'edit_priority' &&
                this.getActionsForEditPriority()}

            {this.props.initialValues.lock_action === 'reassign' &&
                this.getActionsForReassignment()}
            </div>
        )
    }

    render() {
        return (<div className='ItemActionConfirmation' >
                <form onSubmit={this.props.handleSubmit}>
                    <div className='ItemActionConfirmation__metadata'>
                        { this.getAssignmentDetails() }
                    </div>
                    {this.getAssignmentActions()}
                    <button type="submit" style={{ visibility: 'hidden' }}>Submit</button>
                </form>
            </div>)
    }
}

Component.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object.isRequired,
    desks: PropTypes.array,
    users: PropTypes.array,
    currentDesk: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object,
    ]),
    change: PropTypes.func,
    coverageProviders: PropTypes.array,

    // If `onHide` is defined, then `ModalWithForm` component will call it
    // eslint-disable-next-line react/no-unused-prop-types
    onHide: PropTypes.func,
}

// Decorate the form container
const UpdateAssignmentFormComponent = reduxForm({
    form: FORM_NAMES.UpdateAssignmentForm,
    validate: ChainValidators([RequiredFieldsValidatorFactory(['assigned_to.desk'])]),
    touchOnBlur: false,
    // enableReinitialize: true, //the form will reinitialize every time the initialValues prop changes
})(Component)

const selector = formValueSelector(FORM_NAMES.UpdateAssignmentForm)

const mapStateToProps = (state) => ({
    desks: selectors.getDesks(state),
    users: selectors.getUsers(state),
    coverageProviders: selectors.getCoverageProviders(state),
    currentDesk: selector(state, 'assigned_to.desk'),
})

const mapDispatchToProps = (dispatch) => ({
    /** `handleSubmit` will call `onSubmit` after validation */
    onSubmit: (assignment) => {
        // Convert desk selected to id as backend expects desk._id
        if (get(assignment, 'assigned_to.desk._id')) {
            assignment.assigned_to.desk = assignment.assigned_to.desk._id
        }

        return dispatch(actions.assignments.ui.save(assignment))
        .then(() => {
            dispatch({
                type: ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT,
                payload: { assignment },
            })
        })
    },

    onHide: (assignment) => {
        if (assignment.lock_action === 'edit_priority' ||
            assignment.lock_action === 'reassign') {
            dispatch(actions.assignments.api.unlock(assignment))
        }
    },
})

export const UpdateAssignmentForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { withRef: true }
)(UpdateAssignmentFormComponent)
