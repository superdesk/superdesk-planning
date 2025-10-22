import React from 'react';
import {cloneDeep, set} from 'lodash';

import type {ICoverageProvider, IPlanningCoverageItem} from 'interfaces';

import {Modal} from '../';
import {Button} from '../UI';
import {AssignmentEditor} from './AssignmentEditor';
import {planningApi, superdeskApi} from '../../superdeskApi';
import * as actions from '../../actions';
import {isAssignmentDeskValid} from '../../validators/assignments';

interface IProps {
    handleHide: () => void;
    modalProps: {
        field: string;
        value: IPlanningCoverageItem;
        onChange(field: string, value: IPlanningCoverageItem): void;
        priorityPrefix?: string;
        disableDeskSelection?: boolean;
        disableUserSelection?: boolean;
    };
}

interface IState {
    valid: boolean;
    submitting: boolean;
    diff: IPlanningCoverageItem;
}

export class EditCoverageAssignmentModal extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            submitting: false,
            diff: cloneDeep(props.modalProps.value),
            valid: isAssignmentDeskValid(props.modalProps.value.assigned_to?.desk),
        };
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
        });
    }

    onSubmit = () => {
        this.setState({submitting: true}, () => {
            this.props.modalProps.onChange(this.props.modalProps.field, this.state.diff);

            planningApi.redux.store.dispatch(actions.users.setCoverageDefaultDesk(this.state.diff));

            this.props.handleHide();
        });
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {handleHide} = this.props;
        const {priorityPrefix = '', disableDeskSelection, disableUserSelection} = this.props.modalProps;
        const {valid, submitting, diff} = this.state;

        return (
            <Modal
                show={true}
                onHide={handleHide}
                fill={false}
                removeTabIndexAttribute={true}
            >
                <Modal.Header>
                    <h3 className="modal__heading">{gettext('Coverage Assignment Details')}</h3>
                    {submitting ? null : (
                        <a className="icn-btn" aria-label={gettext('Close')} onClick={handleHide}>
                            <i className="icon-close-small" />
                        </a>
                    )}
                </Modal.Header>
                <Modal.Body>
                    <div className="update-assignment">
                        <AssignmentEditor
                            value={diff}
                            onChange={this.onChange}
                            priorityPrefix={priorityPrefix}
                            disableDeskSelection={disableDeskSelection}
                            disableUserSelection={disableUserSelection}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        text={gettext('Cancel')}
                        disabled={submitting}
                        onClick={handleHide}
                    />
                    <Button
                        text={gettext('OK')}
                        color="primary"
                        disabled={!valid || submitting}
                        onClick={this.onSubmit}
                        enterKeyIsClick={true}
                    />
                </Modal.Footer>
            </Modal>
        );
    }
}
