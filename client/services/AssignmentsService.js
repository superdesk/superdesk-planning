import {get} from 'lodash';
import React from 'react';
import {Provider} from 'react-redux';

import {gettext} from '../utils';

import {WORKSPACE, MODALS, ASSIGNMENTS} from '../constants';
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
                    return Promise.resolve();
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
                    return Promise.resolve();
                }

                // Otherwise attempt to get an open Assignment (state==assigned)
                // based on the slugline of the archive item
                return new Promise((resolve, reject) => {
                    this.getBySlugline(get(archiveItem, 'slugline'), get(archiveItem, 'type'))
                        .then((data) => {
                            // If no Assignments were found, then there is nothing to do
                            if (get(data, '_meta.total', 0) < 1) {
                                return resolve();
                            }

                            // Show the LinkToAssignment modal for further user decisions
                            return this.showLinkAssignmentModal(archiveItem, resolve, reject);
                        })
                        .catch(() => {
                            // If the API call failed, allow the publishing to continue
                            this.notify.warning(gettext('Failed to find an Assignment to link to!'));

                            resolve();
                        });
                });
            })
            .catch(() => {
                this.notify.warning(gettext('Failed to fetch item from archive'));
                return Promise.resolve();
            });
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

                                const onUnload = () => {
                                    closeModal();
                                    store.dispatch(actions.resetStore());
                                };

                                const $scope = {
                                    resolve: () => {
                                        onUnload();
                                        resolve();
                                    },
                                    reject: () => {
                                        onUnload();
                                        reject();
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
