import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {isEqual, get} from 'lodash';
import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {ASSIGNMENTS} from '../../../constants';
import {gettext, getItemInArrayById} from '../../../utils';
import {Row, TextInput, ColouredValueInput} from '../../UI/Form';
import {AbsoluteDate} from '../..';

export class EditPriorityComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {priority: {}};

        this.dom = {popupContainer: null};
        this.onChange = this.onChange.bind(this);
    }

    componentWillMount() {
        const priorityQcode = get(this.props, 'initialValues.priority');
        const priority = priorityQcode ?
            getItemInArrayById(this.props.priorities, priorityQcode, 'qcode') :
            null;

        this.setState({priority});
    }

    onChange(field, value) {
        this.setState({priority: value});

        if (isEqual(get(value, 'qcode') || null, get(this.props, 'initialValues.priority') || null)) {
            this.props.disableSaveInModal();
        } else {
            this.props.enableSaveInModal();
        }
    }

    submit() {
        return this.props.onSubmit({
            ...this.props.initialValues,
            priority: get(this.state.priority, 'qcode') || null
        });
    }

    render() {
        const slugline = get(this.props, 'initialValues.planning.slugline') || '';
        const scheduled = get(this.props, 'initialValues.planning.scheduled') || '';

        const deskId = get(this.props, 'initialValues.assigned_to.desk') || null;
        const desk = deskId ?
            getItemInArrayById(this.props.desks, deskId) :
            {};

        const userId = get(this.props, 'initialValues.assigned_to.user') || null;
        const user = userId ?
            getItemInArrayById(this.props.users, userId) :
            {};

        const provider = get(this.props, 'initialValues.assigned_to.coverage_provider') || {};

        const infoProps = {
            labelLeft: true,
            borderBottom: false,
            readOnly: true
        };

        return (
            <div>
                <Row noPadding={true}>
                    <TextInput
                        label={gettext('Slugline:')}
                        value={slugline}
                        inputClassName="sd-text__slugline"
                        {...infoProps}
                    />
                </Row>

                <Row noPadding={true}>
                    <TextInput
                        label={gettext('Desk:')}
                        value={get(desk, 'name') || '-'}
                        {...infoProps}
                    />
                </Row>

                <Row noPadding={true}>
                    <TextInput
                        label={gettext('User:')}
                        value={get(user, 'display_name') || '-'}
                        {...infoProps}
                    />
                </Row>

                <Row noPadding={true}>
                    <TextInput
                        label={gettext('Provider:')}
                        value={get(provider, 'name') || '-'}
                        {...infoProps}
                    />
                </Row>

                <Row>
                    <AbsoluteDate
                        asTextInput={true}
                        label={gettext('Due:')}
                        date={scheduled.toString()}
                        noDateString="-"
                        {...infoProps}
                    />
                </Row>

                <Row noPadding={true}>
                    <ColouredValueInput
                        field="priority"
                        label={gettext('Priority')}
                        value={this.state.priority}
                        onChange={this.onChange}
                        options={this.props.priorities}
                        iconName="priority-label"
                        noMargin={true}
                        popupContainer={() => this.dom.popupContainer}
                    />
                </Row>

                <div ref={(node) => this.dom.popupContainer = node} />
            </div>
        );
    }
}

EditPriorityComponent.propTypes = {
    initialValues: PropTypes.object,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,
    priorities: PropTypes.array,
    desks: PropTypes.array,
    users: PropTypes.array,
};

const mapStateToProps = (state) => ({
    priorities: selectors.getAssignmentPriorities(state),
    desks: selectors.getDesks(state),
    users: selectors.getUsers(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (assignment) => dispatch(actions.assignments.ui.save(assignment))
        .then(() => dispatch({
            type: ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT,
            payload: {assignment}
        })),

    onHide: (assignment) => {
        if (assignment.lock_action === 'edit_priority') {
            dispatch(actions.assignments.api.unlock(assignment));
        }
    }
});

export const EditPriorityForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(EditPriorityComponent);
