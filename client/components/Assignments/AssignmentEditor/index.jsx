import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {get, cloneDeep, isEqual} from 'lodash';
import {getItemInArrayById, getUsersForDesk, getDesksForUser, gettext} from '../../../utils';
import {validateItem} from '../../../validators';

import {
    Row,
    SelectInput,
    ColouredValueInput,
    SelectUserInput,
} from '../../UI/Form';
import {ASSIGNMENTS} from '../../../constants';

export class AssignmentEditorComponent extends React.Component {
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
        const priority = getItemInArrayById(props.priorities, priorityQcode, 'qcode');

        const errors = {};

        this.state = {
            userId,
            user,
            deskId,
            desk,
            filteredUsers,
            filteredDesks,
            priorityQcode,
            priority,
            errors
        };

        this.onChange = this.onChange.bind(this);
        this.onUserChange = this.onUserChange.bind(this);
        this.onDeskChange = this.onDeskChange.bind(this);
        this.onPriorityChange = this.onPriorityChange.bind(this);
    }

    componentWillMount() {
        // Force field validation
        this.onChange(null, null);
        if (!this.state.priorityQcode) {
            this.onPriorityChange(
                this.FIELDS.PRIORITY,
                getItemInArrayById(this.props.priorities, ASSIGNMENTS.DEFAULT_PRIORITY, 'qcode')
            );
        }
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

        if (priorityQcode && priorityQcode !== this.state.priorityQcode) {
            this.onPriorityChange(null, getItemInArrayById(nextProps.priorities, priorityQcode, 'qcode'));
        }
    }

    onChange(field, value, state = {}) {
        const errors = cloneDeep(this.state.errors);
        const newState = {
            ...this.state,
            ...state,
        };

        this.props.onValidate(newState, errors);
        newState.errors = errors;
        this.setState(newState);

        // If a field name is provided, then call onChange so
        // the parent can update the field's value
        if (field !== null) {
            this.props.onChange(field, value || null);
        }

        // If there are no errors, then tell our parent the Assignment is valid
        // otherwise, tell the parent the Assignment is invalid
        this.props.setValid(isEqual(errors, {}));
    }

    onUserChange(field, value) {
        const userId = get(value, '_id');

        if (userId !== this.state.userId) {
            this.onChange(this.FIELDS.USER, get(value, '_id'), {
                userId: userId,
                user: value,
                filteredDesks: getDesksForUser(value, this.props.desks)
            });
        }
    }

    onDeskChange(field, value) {
        const deskId = get(value, '_id');

        if (deskId !== this.state.deskId) {
            this.onChange(this.FIELDS.DESK, get(value, '_id'), {
                deskId: deskId,
                desk: value,
                filteredUsers: getUsersForDesk(value, this.props.users)
            });
        }
    }

    onPriorityChange(field, value) {
        const priorityQcode = get(value, 'qcode');

        if (priorityQcode !== this.state.priorityQcode) {
            this.onChange(this.FIELDS.PRIORITY, get(value, 'qcode'), {
                priorityQcode: priorityQcode,
                priority: value,
            });
        }
    }

    render() {
        const {
            value,
            coverageProviders,
            priorities,
            popupContainer,
            disableDeskSelection,
            showDesk,
            showPriority,
            className,
        } = this.props;

        return (
            <div className={className}>
                {showDesk && (
                    <Row>
                        <SelectInput
                            field={this.FIELDS.DESK}
                            label={gettext('Desk')}
                            value={this.state.desk}
                            onChange={this.onDeskChange}
                            options={this.state.filteredDesks}
                            labelField="name"
                            keyField="_id"
                            clearable={true}
                            readOnly={disableDeskSelection}
                            message={get(this.state, 'errors.desk')}
                            invalid={!!get(this.state, 'errors.desk')}
                            autoFocus
                        />
                    </Row>
                )}

                <Row noPadding={showDesk}>
                    <SelectInput
                        field={this.FIELDS.PROVIDER}
                        label={gettext('Coverage Provider')}
                        value={get(value, this.FIELDS.PROVIDER, null)}
                        onChange={this.onChange}
                        options={coverageProviders}
                        labelField="name"
                        keyField="qcode"
                        clearable={true}
                    />
                </Row>

                <SelectUserInput
                    field={this.FIELDS.USER}
                    label={gettext('User')}
                    value={this.state.user}
                    onChange={this.onUserChange}
                    users={this.state.filteredUsers}
                    popupContainer={popupContainer}
                />

                {showPriority && (
                    <Row noPadding={true}>
                        <ColouredValueInput
                            field={this.FIELDS.PRIORITY}
                            label={gettext('Assignment Priority')}
                            value={this.state.priority}
                            onChange={this.onPriorityChange}
                            options={priorities}
                            iconName="priority-label"
                            noMargin={true}
                            popupContainer={popupContainer}
                        />
                    </Row>
                )}
            </div>
        );
    }
}

AssignmentEditorComponent.propTypes = {
    value: PropTypes.object,
    onChange: PropTypes.func,
    onClose: PropTypes.func,
    users: PropTypes.array,
    desks: PropTypes.array,
    coverageProviders: PropTypes.array,
    priorities: PropTypes.array,
    priorityPrefix: PropTypes.string,
    fromCoverage: PropTypes.bool,
    disableDeskSelection: PropTypes.bool,
    popupContainer: PropTypes.func,
    showDesk: PropTypes.bool,
    showPriority: PropTypes.bool,
    className: PropTypes.string,
    onValidate: PropTypes.func,
    setValid: PropTypes.func,
};

AssignmentEditorComponent.defaultProps = {
    priorityPrefix: '',
    fromCoverage: false,
    showDesk: true,
    showPriority: true,
};

const mapDispatchToProps = (dispatch) => ({
    onValidate: (diff, errors) => dispatch(validateItem('assignment', diff, {}, errors))
});

export const AssignmentEditor = connect(
    null,
    mapDispatchToProps
)(AssignmentEditorComponent);
