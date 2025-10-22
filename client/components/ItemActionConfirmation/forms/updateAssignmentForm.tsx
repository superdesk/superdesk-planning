import React from 'react';
import {connect} from 'react-redux';
import {get, set, isEqual, cloneDeep} from 'lodash';

import type {IDesk} from 'superdesk-api';
import type {IAssignmentItem, IAssignmentPriority, ICoverageProvider} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import * as actions from '../../../actions';
import * as selectors from '../../../selectors';

import {ASSIGNMENTS} from '../../../constants';
import {getItemInArrayById, assignmentUtils} from '../../../utils';
import {getUserInterfaceLanguageFromCV} from '../../../utils/users';
import {onItemActionModalHide} from './utils';
import {isAssignmentDeskValid} from '../../../validators/assignments';

import {AssignmentEditor} from '../../Assignments';

import {Row, TextInput, ColouredValueInput} from '../../UI/Form';
import {AbsoluteDate} from '../..';

import '../style.scss';

interface IReduxStateProps {
    priorities: Array<IAssignmentPriority>;
    desks: Array<IDesk>;
}

interface IReduxDispatchProps {
    onSubmit(original: IAssignmentItem, updates: IAssignmentItem): void;
    onHide(original: IAssignmentItem, modalProps: any): void; // TODO-PR
}

interface IOwnProps {
    original: IAssignmentItem;
    enableSaveInModal(): void;
    disableSaveInModal(): void;
}

type IProps = IOwnProps & IReduxStateProps & IReduxDispatchProps;

interface IState {
    diff: IAssignmentItem;
    valid: boolean;
}

export class UpdateAssignmentComponent extends React.Component<IProps, IState> {
    dom: {popupContainer: HTMLDivElement | null};

    constructor(props: IProps) {
        super(props);
        this.state = {
            diff: cloneDeep(this.props.original),
            valid: isAssignmentDeskValid(this.props.original.assigned_to?.desk),
        };

        this.dom = {popupContainer: null};
    }

    onChange = (updates: {[field: string]: string | ICoverageProvider | null}) => {
        this.setState((prevState) => {
            const diff = cloneDeep(prevState.diff);

            for (const [field, value] of Object.entries(updates)) {
                set(diff, field, value);
            }

            return {
                diff: diff,
                valid: isAssignmentDeskValid(diff.assigned_to?.desk),
            };
        }, () => {
            if (isEqual(this.state.diff, this.props.original) || this.state.valid !== true) {
                this.props.disableSaveInModal();
            } else {
                this.props.enableSaveInModal();
            }
        });
    }

    submit = () => {
        return this.props.onSubmit(
            this.props.original,
            this.state.diff
        );
    }

    getPopupContainer = () => {
        return this.dom.popupContainer;
    }

    render() {
        const {gettext} = superdeskApi.localization;
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
                        onChange={(field, value) => {
                            this.onChange({[field]: value});
                        }}
                        options={this.props.priorities}
                        iconName="priority-label"
                        noMargin={true}
                        noValueString="-"
                        language={getUserInterfaceLanguageFromCV()}
                        clearable={true}
                        popupContainer={this.getPopupContainer}
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
                    showDesk={canEditDesk}
                    showPriority={false}
                    popupContainer={this.getPopupContainer}
                />

                <div ref={(node) => this.dom.popupContainer = node} />
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    priorities: selectors.getAssignmentPriorities(state),
    desks: selectors.general.desks(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (original, updates) => dispatch(
        actions.assignments.ui.save(original, updates)
    )
        .then((updatedAssignment) => dispatch({
            type: ASSIGNMENTS.ACTIONS.UNLOCK_ASSIGNMENT,
            payload: {assignment: updatedAssignment},
        })),

    onHide: (original: IAssignmentItem, modalProps) => onItemActionModalHide(
        original,
        original.lock_action === ASSIGNMENTS.ITEM_ACTIONS.REASSIGN.lock_action,
        modalProps,
    ),
});

export const UpdateAssignmentForm = connect<IReduxStateProps, IReduxDispatchProps, IOwnProps>(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {forwardRef: true}
)(UpdateAssignmentComponent);
