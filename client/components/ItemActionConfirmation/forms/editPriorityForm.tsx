import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {isEqual, get} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';

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
        const priorityQcode = get(this.props, 'original.priority');
        const priority = priorityQcode ?
            getItemInArrayById(this.props.priorities, priorityQcode, 'qcode') :
            null;

        this.setState({priority});
    }

    onChange(field, value) {
        this.setState({priority: value});

        if (isEqual(
            get(value, 'qcode') || null,
            get(this.props, 'original.priority') || null)
        ) {
            this.props.disableSaveInModal();
        } else {
            this.props.enableSaveInModal();
        }
    }

    submit() {
        return this.props.onSubmit(
            this.props.original,
            {
                ...this.props.original,
                priority: get(this.state.priority, 'qcode') || null,
            }
        );
    }

    render() {
        const slugline = get(this.props, 'original.planning.slugline') || '';
        const scheduled = get(this.props, 'original.planning.scheduled') || '';

        const deskId = get(this.props, 'original.assigned_to.desk') || null;
        const desk = deskId ?
            getItemInArrayById(this.props.desks, deskId) :
            {};

        const userId = get(this.props, 'original.assigned_to.user') || null;
        const user = userId ?
            getItemInArrayById(this.props.users, userId) :
            {};

        const provider = get(this.props, 'original.assigned_to.coverage_provider') || {};

        const infoProps = {
            labelLeft: true,
            borderBottom: false,
            readOnly: true,
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
                        language={getUserInterfaceLanguage()}
                        clearable={true}
                    />
                </Row>

                <div ref={(node) => this.dom.popupContainer = node} />
            </div>
        );
    }
}

EditPriorityComponent.propTypes = {
    original: PropTypes.object,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,
    priorities: PropTypes.array,
    desks: PropTypes.array,
    users: PropTypes.array,
};

const mapStateToProps = (state) => ({
    priorities: selectors.getAssignmentPriorities(state),
    desks: selectors.general.desks(state),
    users: selectors.general.users(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (original, updates) => dispatch(
        actions.assignments.ui.save(original, updates)
    )
        .then((updatedAssignment) => dispatch({
            type: ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT,
            payload: {assignment: updatedAssignment},
        })),

    onHide: (assignment) => {
        if (assignment.lock_action === 'edit_priority') {
            dispatch(actions.assignments.api.unlock(assignment));
        }
    },
});

export const EditPriorityForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {forwardRef: true}
)(EditPriorityComponent);
