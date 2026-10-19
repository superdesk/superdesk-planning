import React from 'react';
import {connect} from 'react-redux';
import {cloneDeep} from 'lodash';
import {IDesk, IUser} from 'superdesk-api';

import {superdeskApi, planningApi} from '../../superdeskApi';
import {
    IEventItem,
    IEventOrPlanningItem,
    IG2ContentType,
    IPlanningItem,
    IPlanningNewsCoverageStatus,
} from '../../interfaces';
import {EVENTS, WORKFLOW_STATE} from '../../constants';
import {modifyCoverageForServer} from '../../utils/planning';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import planningApis from '../../actions/planning/api';

import {CoverageAddAdvancedModal} from './CoverageAddAdvancedModal';

interface IOwnProps {
    item: IEventOrPlanningItem;
    onClose(): void;
}

interface IReduxStateProps {
    contentTypes: Array<IG2ContentType>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    users: Array<IUser>;
    desks: Array<IDesk>;
    coverageAddAdvancedMode: boolean;
}

interface IProps extends IOwnProps, IReduxStateProps {
    dispatch(action: any): any;
}

interface IState {
    lockedItem: IEventOrPlanningItem | null; // Locked item with updated _etag
}

/**
 * Locks the item, edits its coverages in `CoverageAddAdvancedModal`, saves and unlocks.
 * Used by the "Edit Coverages" action of planning and event list items.
 */
class EditCoveragesModalComponent extends React.Component<IProps, IState> {
    private mounted = false;
    private released = false;

    constructor(props: IProps) {
        super(props);
        this.state = {lockedItem: null};
    }

    componentDidMount() {
        const {gettext} = superdeskApi.localization;
        const {item} = this.props;

        this.mounted = true;
        window.addEventListener('beforeunload', this.unlockIfHeld);

        planningApi.locks.lockItem(item, 'edit_coverages')
            .then((lockedItem) => {
                if (this.mounted) {
                    this.setState({lockedItem: lockedItem});
                } else {
                    planningApi.locks.unlockItem(lockedItem).catch(() => undefined);
                }
            })
            .catch((error) => {
                console.error('Failed to lock item:', error);

                superdeskApi.ui.alert(item.type === 'event'
                    ? gettext(
                        'Unable to edit coverages. This event is currently locked by another user. ' +
                        'Please try again later or contact the user to release the lock.'
                    )
                    : gettext(
                        'Unable to edit coverages. This planning item is currently locked by another user. ' +
                        'Please try again later or contact the user to release the lock.'
                    )
                );
                this.close();
            });
    }

    componentWillUnmount() {
        this.mounted = false;
        window.removeEventListener('beforeunload', this.unlockIfHeld);
        this.unlockIfHeld();
    }

    // Best-effort unlock when the page closes or the list item goes away with the modal open
    unlockIfHeld = () => {
        if (this.state.lockedItem != null && !this.released) {
            this.released = true;
            planningApi.locks.unlockItem(this.state.lockedItem).catch(() => undefined);
        }
    };

    close() {
        this.released = true;
        this.props.onClose();
    }

    unlockAndClose(item: IEventOrPlanningItem) {
        this.released = true;

        return planningApi.locks.unlockItem(item)
            .catch((error) => {
                console.error('Failed to unlock item:', error);
            })
            .finally(() => {
                this.props.onClose();
            });
    }

    saveCoverages(item: IEventOrPlanningItem, coverages): Promise<IEventOrPlanningItem> {
        const {dispatch} = this.props;

        if (item.type === 'event') {
            // Patch only the coverages. The full event save also syncs linked planning items,
            // which this modal does not load.
            const coveragesForServer = cloneDeep(coverages);

            coveragesForServer.forEach((coverage) => modifyCoverageForServer(coverage));

            return planningApi.events.update(item as IEventItem, {
                coverages: coveragesForServer,
                update_method: EVENTS.UPDATE_METHODS[0].value,
            } as Partial<IEventItem>)
                .then(([savedEvent]) => {
                    dispatch(actions.events.api.receiveEvents([savedEvent]));

                    return savedEvent;
                });
        }

        return dispatch(planningApis.save(item as IPlanningItem, {coverages: coverages}))
            .then((savedPlanning: IPlanningItem) => {
                dispatch(planningApis.receivePlannings([savedPlanning]));

                return savedPlanning;
            });
    }

    onSave = (field: string, value: any) => {
        const itemToSave = this.state.lockedItem;
        const coveragesToSave = Array.isArray(value)
            ? value.filter((coverage) => coverage.workflow_status !== WORKFLOW_STATE.SPIKED)
            : value;

        this.saveCoverages(itemToSave, coveragesToSave)
            .then((savedItem) => this.unlockAndClose(savedItem ?? itemToSave))
            .catch((error) => {
                console.error('Failed to save coverages:', error);
                this.unlockAndClose(itemToSave);
            });
    };

    render() {
        if (this.state.lockedItem == null) {
            return null;
        }

        return (
            <div onClick={(e) => e.stopPropagation()}> {/* avoid opening preview on click in the modal */}
                <CoverageAddAdvancedModal
                    onCancel={() => this.unlockAndClose(this.state.lockedItem)}
                    contentTypes={this.props.contentTypes}
                    newsCoverageStatus={this.props.newsCoverageStatus}
                    field="coverages"
                    value={this.props.item.coverages ?? []}
                    onSave={this.onSave}
                    createCoverage={(qcode) => ({
                        planning: {
                            g2_content_type: qcode,
                            language: null,
                        },
                        workflow_status: 'draft',
                    })}
                    users={this.props.users}
                    desks={this.props.desks}
                    coverageAddAdvancedMode={this.props.coverageAddAdvancedMode}
                />
            </div>
        );
    }
}

const mapStateToProps = (state): IReduxStateProps => ({
    contentTypes: selectors.general.contentTypes(state),
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    coverageAddAdvancedMode: selectors.general.coverageAddAdvancedMode(state),
});

export const EditCoveragesModal = connect(mapStateToProps)(EditCoveragesModalComponent);
