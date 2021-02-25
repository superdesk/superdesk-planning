import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, set, isEqual, cloneDeep} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';

import * as actions from '../../../actions';
import * as selectors from '../../../selectors';

import {ASSIGNMENTS} from '../../../constants';
import {gettext, getItemInArrayById, assignmentUtils} from '../../../utils';

import {AssignmentEditor} from '../../Assignments';

import {Row, TextInput, ColouredValueInput} from '../../UI/Form';
import {AbsoluteDate} from '../..';

import '../style.scss';

export class UpdateAssignmentComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            diff: {},
            valid: true,
        };

        this.dom = {popupContainer: null};
        this.onChange = this.onChange.bind(this);
        this.setValid = this.setValid.bind(this);
    }

    componentWillMount() {
        const diff = cloneDeep(this.props.original);

        this.setState({diff});
    }

    onChange(field, value) {
        const diff = cloneDeep(this.state.diff);

        set(diff, field, value);

        this.setState({diff});

        if (isEqual(diff, this.props.original) || !this.state.valid) {
            this.props.disableSaveInModal();
        } else {
            this.props.enableSaveInModal();
        }
    }

    submit() {
        return this.props.onSubmit(
            this.props.original,
            this.state.diff
        );
    }

    setValid(valid) {
        this.setState({valid});

        if (!valid) {
            this.props.disableSaveInModal();
        }
    }

    render() {
        const slugline = get(this.props, 'original.planning.slugline') || '';
        const scheduled = get(this.props, 'original.planning.scheduled') || '';

        const priorityQcode = get(this.props, 'original.priority');
        const priority = getItemInArrayById(this.props.priorities, priorityQcode, 'qcode');

        const canEditDesk = assignmentUtils.canEditDesk(this.props.original);

        const deskId = get(this.props, 'original.assigned_to.desk') || null;
        const desk = deskId ?
            getItemInArrayById(this.props.desks, deskId) :
            {};

        const infoProps = {
            labelLeft: true,
            borderBottom: false,
            readOnly: true,
        };

        return (
            <div className="update-assignment">
                <Row noPadding={true}>
                    <TextInput
                        label={gettext('Slugline:')}
                        value={slugline || '-'}
                        inputClassName="sd-text__slugline"
                        {...infoProps}
                    />
                </Row>

                <Row noPadding={true}>
                    <AbsoluteDate
                        asTextInput={true}
                        label={gettext('Due:')}
                        date={scheduled.toString()}
                        noDateString="-"
                        {...infoProps}
                    />
                </Row>

                <Row noPadding={!canEditDesk}>
                    <ColouredValueInput
                        field="priority"
                        label={gettext('Priority')}
                        value={priority}
                        onChange={this.onChange}
                        options={this.props.priorities}
                        iconName="priority-label"
                        noMargin={true}
                        noValueString="-"
                        language={getUserInterfaceLanguage()}
                        clearable={true}
                        {...infoProps}
                    />
                </Row>

                {!canEditDesk && (
                    <Row>
                        <TextInput
                            label={gettext('Desk:')}
                            value={get(desk, 'name') || '-'}
                            {...infoProps}
                        />
                    </Row>
                )}

                <AssignmentEditor
                    className="update-assignment__form"
                    value={this.state.diff}
                    onChange={this.onChange}
                    users={this.props.users}
                    desks={this.props.desks}
                    coverageProviders={this.props.coverageProviders}
                    priorities={this.props.priorities}
                    showDesk={canEditDesk}
                    showPriority={false}
                    popupContainer={() => this.dom.popupContainer}
                    setValid={this.setValid}
                />

                <div ref={(node) => this.dom.popupContainer = node} />
            </div>
        );
    }
}

UpdateAssignmentComponent.propTypes = {
    original: PropTypes.object,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    disableSaveInModal: PropTypes.func,
    priorities: PropTypes.array,
    desks: PropTypes.array,
    users: PropTypes.array,
    coverageProviders: PropTypes.array,
};

const mapStateToProps = (state) => ({
    priorities: selectors.getAssignmentPriorities(state),
    desks: selectors.general.desks(state),
    users: selectors.general.users(state),
    coverageProviders: selectors.vocabs.coverageProviders(state),
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
        if (assignment.lock_action === 'reassign') {
            dispatch(actions.assignments.api.unlock(assignment));
        }
    },
});

export const UpdateAssignmentForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {forwardRef: true}
)(UpdateAssignmentComponent);
