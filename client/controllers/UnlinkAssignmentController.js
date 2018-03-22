import {get} from 'lodash';
import {getErrorMessage} from '../utils';
import {ASSIGNMENTS} from '../constants';

UnlinkAssignmentController.$inject = [
    'data',
    'notify',
    'gettext',
    'api',
    'lock',
];

export function UnlinkAssignmentController(
    data,
    notify,
    gettext,
    api,
    lock
) {
    const itemId = get(data, 'item._id');

    return api('archive').getById(itemId)
        .then((newsItem) => {
            let failed = false;

            if (!get(newsItem, 'assignment_id')) {
                notify.error(
                    gettext('Item not linked to a Planning item.')
                );
                failed = true;
            }

            if (failed) {
                return Promise.reject();
            }

            if (lock.isLocked(newsItem)) {
                notify.error(
                    gettext('Item already locked.')
                );
                return Promise.reject();
            }

            return api('assignments').getById(newsItem.assignment_id)
                .then((assignment) => {
                    if (assignment.assigned_to.state === ASSIGNMENTS.WORKFLOW_STATE.COMPLETED) {
                        notify.error('Assignment has already been completed, cannot unlink.');
                        return Promise.reject();
                    }

                    if (!lock.isLockedInCurrentSession(newsItem)) {
                        newsItem._editable = true;
                        return lock.lock(newsItem, false, 'unlink_assignment')
                            .then(
                                (lockedItem) => Promise.resolve({
                                    newsItem: lockedItem,
                                    assignment: assignment,
                                    isLocked: true
                                }),
                                (error) => {
                                    notify.error(
                                        getErrorMessage(error, 'Failed to lock the item.')
                                    );
                                    return Promise.reject(error);
                                }
                            );
                    }

                    // item already locked by the user.
                    return Promise.resolve({
                        newsItem: newsItem,
                        assignment: assignment,
                        isLocked: false
                    });
                }, (error) => {
                    notify.error(
                        getErrorMessage(error, 'Failed to load the assignment.')
                    );
                    return Promise.reject(error);
                });
        }, (error) => {
            notify.error(
                getErrorMessage(error, 'Failed to load the item.')
            );
            return Promise.reject(error);
        })
        .then(
            ({newsItem, assignment, isLocked}) => (
                api('assignments_unlink').save({}, {
                    assignment_id: assignment._id,
                    item_id: newsItem._id,
                })
                    .then(() => {
                        notify.success('Item unlinked from coverage.');
                        // update the scope item.
                        data.item.assignment_id = null;

                        if (!isLocked) {
                            // item is already by the user.
                            return Promise.resolve();
                        }

                        return lock.unlock(newsItem)
                            .then(
                                () =>
                                    // reset the assignment id
                                    Promise.resolve()
                                ,
                                (error) => {
                                    notify.error(
                                        getErrorMessage(error, 'Failed to unlock the item.')
                                    );
                                    return Promise.reject(error);
                                }
                            );
                    }, (error) => {
                        notify.error(
                            getErrorMessage(error, 'Failed to unlink the item.')
                        );
                        return lock.unlock(newsItem)
                            .then(
                                () => Promise.resolve(),
                                (error) => {
                                    notify.error(
                                        getErrorMessage(error, 'Failed to unlock the item.')
                                    );
                                    return Promise.reject(error);
                                }
                            );
                    })
            ),

            (error) => Promise.reject(error)
        );
}
