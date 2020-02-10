import {get} from 'lodash';
import React from 'react';
import {Provider} from 'react-redux';
import moment from 'moment';

import {gettext, planningUtils} from '../utils';

import {WORKSPACE, MODALS, ASSIGNMENTS, DEFAULT_DATE_FORMAT, DEFAULT_TIME_FORMAT} from '../constants';
import {ModalsContainer} from '../components';
import * as actions from '../actions';

export class AssignmentsService {
    constructor(api, notify, modal, sdPlanningStore, deployConfig, desks, config) {
        this.api = api;
        this.notify = notify;
        this.modal = modal;
        this.sdPlanningStore = sdPlanningStore;
        this.deployConfig = deployConfig;
        this.desks = desks;
        this.config = config;

        this.onPublishFromAuthoring = this.onPublishFromAuthoring.bind(this);
        this.onArchiveRewrite = this.onArchiveRewrite.bind(this);
        this.onUnloadModal = this.onUnloadModal.bind();
    }

    getAssignmentQuery(slugline, contentType) {
        return actions.assignments.api.constructQuery({
            systemTimezone: this.config.defaultTimezone,
            searchQuery: `planning.slugline.phrase:("${slugline}")`,
            states: ['assigned'],
            type: contentType,
            dateFilter: 'today',
        });
    }

    onPublishFromAuthoring(item) {
        // Get the complete item from a new query
        return this.api.find('archive', item._id)
            .then((archiveItem) => {
                // If the archive item is already linked to an Assignment
                // then return now (nothing needs to be done)
                if (get(archiveItem, 'assignment_id')) {
                    return Promise.resolve({});
                }

                const fulfilFromDesks = get(
                    this.deployConfig,
                    'config.planning_fulfil_on_publish_for_desks',
                    []
                );
                const currentDesk = get(this.desks, 'active.desk');
                const selectedDeskId = get(archiveItem, 'task.desk') ?
                    archiveItem.task.desk :
                    currentDesk;

                if (fulfilFromDesks.length > 0 && fulfilFromDesks.indexOf(selectedDeskId) < 0) {
                    return Promise.resolve({});
                }

                // Otherwise attempt to get an open Assignment (state==assigned)
                // based on the slugline of the archive item
                return new Promise((resolve, reject) => {
                    this.getBySlugline(get(archiveItem, 'slugline'), get(archiveItem, 'type'))
                        .then((data) => {
                            // If no Assignments were found, then there is nothing to do
                            if (get(data, '_meta.total', 0) < 1) {
                                return resolve({});
                            }

                            // Show the LinkToAssignment modal for further user decisions
                            return this.showLinkAssignmentModal(archiveItem, resolve, reject);
                        })
                        .catch(() => {
                            // If the API call failed, allow the publishing to continue
                            this.notify.warning(gettext('Failed to find an Assignment to link to!'));

                            resolve({});
                        });
                });
            })
            .catch(() => (
                Promise.resolve({warnings: [{text: gettext('Failed to fetch item from archive')}]})
            ));
    }

    onArchiveRewrite(item) {
        if (!get(item, 'assignment_id')) {
            return Promise.resolve(item);
        }

        return this.api('assignments').getById(item.assignment_id)
            .then((assignment) => (
                this.api('planning').query({
                    source: JSON.stringify({
                        query: {terms: {_id: [get(assignment, 'planning_item')]}},
                    }),
                })
                    .then((data) => {
                        let items = get(data, '_items', []);

                        items.forEach((item) => {
                            planningUtils.modifyForClient((item));
                        });

                        const planning = get(items, '[0]');

                        if (!planning) {
                            return Promise.resolve(item);
                        }
                        // Check to see if there is a scheduled update following this assignment
                        // that is available for linking
                        const coverage = get(planning, 'coverages', []).find((c) =>
                            c.coverage_id === assignment.coverage_item);

                        if (!coverage || get(coverage, 'scheduled_updates.length', 0) <= 0) {
                            return Promise.resolve(item);
                        }

                        let availableScheduledUpdate;

                        if (item.assignment_id === get(coverage, 'assigned_to.assignment_id')) {
                            if (![ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED, ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED].includes(
                                get(coverage, 'scheduled_updates[0].assigned_to.state'))) {
                                return Promise.resolve(item);
                            }

                            availableScheduledUpdate = coverage.scheduled_updates[0];
                        } else {
                            const linkedScheduledUpdateIndex = coverage.scheduled_updates.findIndex(
                                (s) => assignment._id === get(s, 'assigned_to.assignment_id'));

                            if (linkedScheduledUpdateIndex < 0 ||
                                (linkedScheduledUpdateIndex === coverage.scheduled_updates.length - 1) ||
                                ![ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED, ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED].includes(
                                    get(coverage,
                                        `scheduled_updates[${linkedScheduledUpdateIndex + 1}].assigned_to.state`))) {
                                return Promise.resolve(item);
                            }

                            availableScheduledUpdate = coverage.scheduled_updates[linkedScheduledUpdateIndex + 1];
                        }

                        if (!availableScheduledUpdate) {
                            return Promise.resolve(item);
                        }

                        return new Promise((resolve, reject) => this.showScheduleUpdatesConfirmationModal(
                            item,
                            availableScheduledUpdate,
                            resolve,
                            reject));
                    }, (error) =>
                        // At errors we leave the archive item as it is
                        Promise.resolve(item)
                    )
            ), (error) =>
                // At errors we leave the archive item as it is
                Promise.resolve(item)
            );
    }

    getBySlugline(slugline, contentType) {
        return this.api('assignments').query({
            source: JSON.stringify({
                query: this.getAssignmentQuery(slugline, contentType),
                size: 0,
            }),
            page: 1,
            sort: '[("planning.scheduled", 1)]',
        });
    }

    onUnloadModal(store, closeModal, action, res) {
        closeModal();
        store.dispatch(actions.resetStore());
        return action(res);
    }

    showScheduleUpdatesConfirmationModal(newsItem, scheduledUpdate, resolve, reject) {
        let store;

        return this.sdPlanningStore.initWorkspace(WORKSPACE.AUTHORING, (newStore) => {
            store = newStore;
            return Promise.resolve();
        })
            .then(() => this.modal.createCustomModal()
                .then(({openModal, closeModal}) => {
                    openModal(
                        <Provider store={store}>
                            <ModalsContainer />
                        </Provider>
                    );

                    const $scope = {
                        resolve: () =>
                        // link to the new assignment
                            this.api('assignments_link').save({}, {
                                assignment_id: get(scheduledUpdate, 'assigned_to.assignment_id'),
                                item_id: newsItem._id,
                                reassign: true,
                                force: true,
                            })
                                .then((item) => {
                                    newsItem.assignment_id = item.assignment_id;
                                    this.onUnloadModal(store, closeModal, resolve, item);
                                }, () => {
                                    this.notify.warning(gettext('Failed to link to requested assignment!'));
                                    this.onUnloadModal(store, closeModal, resolve, newsItem);
                                }),
                        reject: () => {
                            this.onUnloadModal(store, closeModal, resolve, newsItem);
                        },
                    };

                    const time = moment(scheduledUpdate.planning.scheduled).format(
                        DEFAULT_DATE_FORMAT + ' ' + DEFAULT_TIME_FORMAT);
                    const prompt = gettext('Do you want to link it to that assignment ?');

                    store.dispatch(actions.showModal({
                        modalType: MODALS.CONFIRMATION,
                        modalProps: {
                            body: gettext(`There is an update assignment for this story due at '${time}'. ${prompt}`),
                            action: $scope.resolve,
                            onCancel: $scope.reject,
                        },
                    }));
                }));
    }

    showLinkAssignmentModal(item, resolve, reject) {
        let store;

        this.sdPlanningStore.initWorkspace(WORKSPACE.AUTHORING, (newStore) => {
            store = newStore;
            return Promise.resolve();
        })
            .then(() => {
                this.modal.createCustomModal()
                    .then(({openModal, closeModal}) => {
                        openModal(
                            <Provider store={store}>
                                <ModalsContainer />
                            </Provider>
                        );

                        store.dispatch(actions.assignments.ui.loadFulfillModal(
                            item,
                            [
                                ASSIGNMENTS.LIST_GROUPS.TODAY.id,
                                ASSIGNMENTS.LIST_GROUPS.FUTURE.id,
                            ]
                        ))
                            .then(() => {
                                store.dispatch(
                                    actions.assignments.ui.previewFirstInListGroup(
                                        ASSIGNMENTS.LIST_GROUPS.TODAY.id
                                    )
                                );

                                const $scope = {
                                    resolve: () => {
                                        this.onUnloadModal(store, closeModal, resolve);
                                    },
                                    reject: () => {
                                        this.onUnloadModal(store, closeModal, reject);
                                    },
                                };

                                store.dispatch(actions.showModal({
                                    modalType: MODALS.FULFIL_ASSIGNMENT,
                                    modalProps: {
                                        newsItem: item,
                                        fullscreen: true,
                                        $scope: $scope, // Required by actions dispatches
                                        onCancel: $scope.resolve,
                                        onIgnore: $scope.resolve,
                                        showCancel: false,
                                        showIgnore: true,
                                        ignoreText: gettext('Don\'t Fulfil Assignment'),
                                        title: gettext('Fulfil Assignment with this item?'),
                                    },
                                }));
                            });
                    });
            });
    }
}

AssignmentsService.$inject = ['api', 'notify', 'modal', 'sdPlanningStore', 'deployConfig', 'desks', 'config'];
