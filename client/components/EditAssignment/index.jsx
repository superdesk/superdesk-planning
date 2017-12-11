import React from 'react';
import PropTypes from 'prop-types';
import {AssignmentSelect} from './AssignmentSelect';
import {fields} from '../index';
import {getItemInArrayById} from '../../utils';
import {ASSIGNMENTS} from '../../constants';
import {StateLabel} from '../../components';
import {get} from 'lodash';
import moment from 'moment';
import './style.scss';

export class EditAssignment extends React.Component {
    constructor(props) {
        super(props);

        this.state = {openAssignmentSelect: false};
        this.unAssign = this.unAssign.bind(this);
        this.toggleSelection = this.toggleSelection.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    toggleSelection() {
        this.setState({openAssignmentSelect: !this.state.openAssignmentSelect});
    }

    unAssign() {
        this.props.input.onChange({
            ...this.props.input.value,
            desk: null,
            user: null,
        });
    }

    getAssignedDesk() {
        if (!this.props.input.value || !this.props.input.value.desk) {
            return;
        }

        return getItemInArrayById(this.props.desks, this.props.input.value.desk);
    }

    getAssignedUser() {
        if (!this.props.input.value || !this.props.input.value.user) {
            return;
        }

        return getItemInArrayById(this.props.users, this.props.input.value.user);
    }

    onChange(value, toggle = true) {
        const currentTime = moment();

        this.props.input.onChange({
            ...this.props.input.value,
            desk: get(value, 'desk._id'),
            user: get(value, 'user._id'),
            priority: get(value, 'priority'),
            coverage_provider: get(value, 'coverage_provider'),
            assignor_user: this.props.currentUserId,
            assignor_desk: this.props.currentUserId,
            assigned_date_user: currentTime,
            assigned_date_desk: currentTime,
        });

        if (toggle) {
            this.toggleSelection();
        }
    }

    render() {
        const deskAssigned = this.getAssignedDesk();
        const userAssigned = this.getAssignedUser();
        const coverageProvider = get(this.props, 'input.value.coverage_provider');

        const assignmentPriorityInput = {value: get(this.props, 'input.value.priority', ASSIGNMENTS.DEFAULT_PRIORITY)};

        /* eslint-disable camelcase */
        const {
            assignor_user,
            assignor_desk,
            assigned_date_user,
            assigned_date_desk,
        } = get(this.props.input, 'value');

        const deskAssignor = getItemInArrayById(this.props.users, assignor_desk);
        const userAssignor = getItemInArrayById(this.props.users, assignor_user);
        const {context} = this.props;

        const assignmentSelectInput = {
            onChange: this.onChange,
            value: {
                priority: this.props.input.value.priority,
                deskAssigned: deskAssigned,
                userAssigned: userAssigned,
                coverage_provider: coverageProvider,
            },
        };

        const renderAction = (buttonText, callback) => (
            <button
                className="assignment__action pull-right"
                type="button"
                onClick={callback}>
                <a>{buttonText}</a>
            </button>
        );

        const renderUserAvatar = () => (
            <div className="TimeAndAuthor">
                { !deskAssigned && !userAssigned && <label>Unassigned</label> }
                { deskAssigned && <div>
                    Desk:&nbsp;
                    <span className="TimeAndAuthor__author">{deskAssigned.name.toUpperCase()}</span>
                    {' (' + moment(assigned_date_desk).format('HH:mm DD/MM/YYYY') + ', ' +
                        get(deskAssignor, 'display_name', '').toUpperCase() + ')'}
                </div> }
                { userAssigned && <div>
                    Assignee&nbsp;
                    <span className="TimeAndAuthor__author">{get(userAssigned, 'display_name', '').toUpperCase()}</span>
                    {' (' + moment(assigned_date_user).format('HH:mm DD/MM/YYYY') + ', ' +
                        get(userAssignor, 'display_name', '').toUpperCase() + ')'}
                </div> }
                { coverageProvider && <span> {'Coverage Provider: ' + coverageProvider.name} </span>}
            </div>
        );

        const renderCoverageActions = () => (
            <div className="assignment field">
                { renderUserAvatar() }
                { !this.props.readOnly && !get(this.props, 'input.value.assignment_id') &&
                        !this.state.openAssignmentSelect &&
                        renderAction('Create/Edit Assignment', this.toggleSelection) }
            </div>
        );

        const renderAssignmentActions = () => (
            <div className="assignment">
                { renderUserAvatar() }
                { !this.props.readOnly &&
                        !this.state.openAssignmentSelect &&
                        renderAction('Reassign', this.toggleSelection) }
            </div>
        );

        return (
            <div className="field">
                { context === 'coverage' && renderCoverageActions() }
                { context === 'assignment' && renderAssignmentActions() }
                {
                    this.state.openAssignmentSelect &&
                    (<AssignmentSelect
                        users={this.props.users}
                        desks={this.props.desks}
                        deskSelectionDisabled={this.props.deskSelectionDisabled}
                        onCancel={this.toggleSelection}
                        coverageProviders={this.props.coverageProviders}
                        assignmentPriorities={this.props.assignmentPriorities}
                        input={assignmentSelectInput} context={context}
                        showPrioritiesSelection={context === 'coverage'} />)
                }
                {context === 'coverage' && get(this.props, 'input.value.state') &&
                    <div className="sd-line-input">
                        <label className="sd-line-input__label">Assignment Status</label>
                        <StateLabel item={this.props.input.value}/>
                    </div>
                }
                {context === 'coverage' && get(this.props, 'input.value.priority') &&
                        <fields.AssignmentPriorityField
                            label="Assignment Priority"
                            input={assignmentPriorityInput}
                            readOnly={true} />
                }
            </div>
        );
    }
}

EditAssignment.propTypes = {
    users: PropTypes.array.isRequired,
    coverageProviders: PropTypes.array,
    desks: PropTypes.array.isRequired,
    input: PropTypes.object,
    readOnly: PropTypes.bool,
    deskSelectionDisabled: PropTypes.bool,
    context: PropTypes.oneOf(['coverage', 'assignment']).isRequired,
    currentUserId: PropTypes.string,
    assignmentPriorities: PropTypes.array,
};

EditAssignment.defaultProps = {
    context: 'coverage',
    assignmentPriorities: [],
};
