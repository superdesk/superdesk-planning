import {coverageProfiles} from '../selectors/coverageProfiles';
import {PLANNING, WORKFLOW_STATE} from '../constants';
import {ICoverageScheduledUpdate, ICoverageType, IPlanningAPI, IPlanningCoverageItem} from '../interfaces';
import {planningApi, superdeskApi} from '../superdeskApi';

function getCoverageEditorProfile(type: ICoverageType) {
    return coverageProfiles(planningApi.redux.store.getState()).find((x) => x.content_type === type);
}

function cancelCoverageOrScheduledUpdate<T extends IPlanningCoverageItem | ICoverageScheduledUpdate>(
    item: T,
    cancellationReason: string,
): T {
    const nextItem: T = {...item};

    nextItem.news_coverage_status = PLANNING.NEWS_COVERAGE_CANCELLED_STATUS;
    nextItem.planning.workflow_status_reason = cancellationReason;
    nextItem.workflow_status = WORKFLOW_STATE.CANCELLED;

    if (nextItem.assigned_to?.state != null) {
        nextItem.assigned_to.state = WORKFLOW_STATE.CANCELLED;
    }

    return nextItem;
}

function cancelCoverage(
    items: Array<IPlanningCoverageItem>,
    itemToCancel: IPlanningCoverageItem,
): Promise<Array<IPlanningCoverageItem>> {
    const {gettext} = superdeskApi.localization;

    return superdeskApi.ui.prompt({
        inputLabel: gettext('Reason for cancelling the coverage'),
        okButtonText: gettext('Confirm'),
        cancelButtonText: gettext('Cancel'),
    }).then((reason) => {
        return items.map((item) => {
            if (item.coverage_id === itemToCancel.coverage_id) {
                return cancelCoverageOrScheduledUpdate(item, reason);
            } else {
                return item;
            }
        });
    });
}

function cancelScheduledUpdate(
    items: Array<ICoverageScheduledUpdate>,
    itemToCancel: ICoverageScheduledUpdate,
): Promise<Array<ICoverageScheduledUpdate>> {
    const {gettext} = superdeskApi.localization;

    return superdeskApi.ui.prompt({
        inputLabel: gettext('Reason for cancelling the scheduled update'),
        okButtonText: gettext('Confirm'),
        cancelButtonText: gettext('Cancel'),
    }).then((reason) => {
        return items.map((item) => {
            if (item.scheduled_update_id === itemToCancel.scheduled_update_id) {
                return cancelCoverageOrScheduledUpdate(item, reason);
            } else {
                return item;
            }
        });
    });
}

export const coverages: IPlanningAPI['coverages'] = {
    getEditorProfile: getCoverageEditorProfile,
    cancelCoverage: cancelCoverage,
    cancelScheduledUpdate: cancelScheduledUpdate,
};
