import React from 'react';
import PropTypes from 'prop-types';

import {get} from 'lodash';
import {getItemInArrayById, getUsersForDesk, getDesksForUser} from '../../../utils';

import {
    Row,
    SelectInput,
    ColouredValueInput,
    SelectUserInput,
} from '../../UI/Form';

export class AssignmentEditor extends React.Component {
    constructor(props) {
        super(props);

        this.FIELDS = {
            USER: 'assigned_to.user',
            DESK: 'assigned_to.desk',
            PRIORITY: `${props.priorityPrefix}priority`,
            PROVIDER: 'assigned_to.coverage_provider',
        };

        const userId = get(props.value, this.FIELDS.USER);
        const user = getItemInArrayById(props.users, userId);

        const deskId = get(props.value, this.FIELDS.DESK);
        const desk = getItemInArrayById(props.desks, deskId);

        const filteredUsers = getUsersForDesk(desk, props.users);
        const filteredDesks = getDesksForUser(user, props.desks);

        const priorityQcode = get(props.value, this.FIELDS.PRIORITY);
        const priority = getItemInArrayById(props.priorities, priorityQcode);

        this.state = {
            userId,
            user,
            deskId,
            desk,
            filteredUsers,
            filteredDesks,
            priorityQcode,
            priority,
        };

        this.onUserChange = this.onUserChange.bind(this);
        this.onDeskChange = this.onDeskChange.bind(this);
        this.onPriorityChange = this.onPriorityChange.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        const userId = get(nextProps.value, this.FIELDS.USER);
        const deskId = get(nextProps.value, this.FIELDS.DESK);
        const priorityQcode = get(nextProps.value, this.FIELDS.PRIORITY);

        if (userId !== this.state.userId) {
            this.onUserChange(null, getItemInArrayById(nextProps.users, userId));
        }

        if (deskId !== this.state.deskId) {
            this.onDeskChange(null, getItemInArrayById(nextProps.desks, deskId));
        }

        if (priorityQcode !== this.state.priorityQcode) {
            this.onPriorityChange(null, getItemInArrayById(nextProps.priorities, priorityQcode));
        }
    }

    onUserChange(field, value) {
        const userId = get(value, '_id');

        if (userId !== this.state.userId) {
            this.setState(
                {
                    userId: userId,
                    user: value,
                    filteredDesks: getDesksForUser(value, this.props.desks),
                },
                () => this.props.onChange(this.FIELDS.USER, get(value, '_id') || null)
            );
        }
    }

    onDeskChange(field, value) {
        const deskId = get(value, '_id');

        if (deskId !== this.state.deskId) {
            this.setState(
                {
                    deskId: deskId,
                    desk: value,
                    filteredUsers: getUsersForDesk(value, this.props.users),
                },
                () => this.props.onChange(this.FIELDS.DESK, get(value, '_id') || null)
            );
        }
    }

    onPriorityChange(field, value) {
        const priorityQcode = get(value, 'qcode');

        if (priorityQcode !== this.state.priorityQcode) {
            this.setState(
                {
                    priorityQcode: priorityQcode,
                    priority: value,
                },
                () => this.props.onChange(this.FIELDS.PRIORITY, get(value, 'qcode') || null)
            );
        }
    }

    render() {
        const {
            value,
            onChange,
            coverageProviders,
            priorities,
            popupContainer,
        } = this.props;

        return (
            <div>
                <Row>
                    <SelectInput
                        field={this.FIELDS.DESK}
                        label="Desk"
                        value={this.state.desk}
                        onChange={this.onDeskChange}
                        options={this.state.filteredDesks}
                        labelField="name"
                        keyField="_id"
                        clearable={true}
                    />
                </Row>

                <SelectInput
                    field={this.FIELDS.PROVIDER}
                    label="Coverage Provider"
                    value={get(value, this.FIELDS.PROVIDER, null)}
                    onChange={onChange}
                    options={coverageProviders}
                    labelField="name"
                    keyField="qcode"
                    clearable={true}
                />

                <SelectUserInput
                    field={this.FIELDS.USER}
                    label="User"
                    value={this.state.user}
                    onChange={this.onUserChange}
                    users={this.state.filteredUsers}
                    popupContainer={popupContainer}
                />

                <Row noPadding={true}>
                    <ColouredValueInput
                        field={this.FIELDS.PRIORITY}
                        label="Assignment Priority"
                        value={this.state.priority}
                        onChange={this.onPriorityChange}
                        options={priorities}
                        iconName="priority-label"
                        noMargin={true}
                        popupContainer={popupContainer}
                    />
                </Row>
            </div>
        );
    }
}

AssignmentEditor.propTypes = {
    value: PropTypes.object,
    onChange: PropTypes.func,
    onClose: PropTypes.func,
    users: PropTypes.array,
    desks: PropTypes.array,
    coverageProviders: PropTypes.array,
    priorities: PropTypes.array,
    priorityPrefix: PropTypes.string,
    fromCoverage: PropTypes.bool,
    popupContainer: PropTypes.func,
};

AssignmentEditor.defaultProps = {
    priorityPrefix: '',
    fromCoverage: false,
};
