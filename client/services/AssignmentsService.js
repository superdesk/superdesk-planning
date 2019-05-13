import {get} from 'lodash';
import React from 'react';
import {Provider} from 'react-redux';

import {gettext} from '../utils';

import planningUtils from '../utils/planning';
import {WORKSPACE, MODALS} from '../constants';
import {ModalsContainer} from '../components';
import * as actions from '../actions';

export class AssignmentsService {
    constructor(api, notify, modal, sdPlanningStore, deployConfig, desks) {
        this.api = api;
        this.notify = notify;
        this.modal = modal;
        this.sdPlanningStore = sdPlanningStore;
        this.deployConfig = deployConfig;
        this.desks = desks;

        this.onPublishFromAuthoring = this.onPublishFromAuthoring.bind(this);
    }

    getAssignmentQuery(slugline, contentType) {
        return {
            must: [
                {term: {'assigned_to.state': 'assigned'}},
                {query_string: {
                    query: `planning.slugline.phrase('${slugline}')`,
                    lenient: false,
                }},
                {term: {'planning.g2_content_type': contentType}},
            ],
        };
    }

    onPublishFromAuthoring(item) {
        // If the archive item is already linked to an Assignment
        // then return now (nothing needs to be done)
        if (get(item, 'assignment_id')) {
            return Promise.resolve();
        }

        const fulfilFromDesks = get(this.deployConfig, 'config.planning_fulfil_on_publish_for_desks', []);
        const currentDesk = get(this.desks, 'active.desk');

        if (fulfilFromDesks.length > 0 && fulfilFromDesks.indexOf(currentDesk) < 0) {
            return Promise.resolve();
        }

        // Otherwise attempt to get an open Assignment (state==assigned)
        // based on the slugline of the archive item
        return new Promise((resolve, reject) => {
            this.getBySlugline(get(item, 'slugline'), get(item, 'type'))
                .then((assignments) => {
                    // If no Assignments were found, then there is nothing to do
                    if (!Array.isArray(assignments) || assignments.length === 0) {
                        return resolve();
                    }

                    // Show the LinkToAssignment modal for further user decisions
                    return this.showLinkAssignmentModal(item, assignments, resolve, reject);
                })
                .catch(() => {
                    // If the API call failed, allow the publishing to continue
                    this.notify.warning(gettext('Failed to find an Assignment to link to!'));

                    resolve();
                });
        });
    }

    getBySlugline(slugline, contentType) {
        return this.api('assignments').query({
            source: JSON.stringify({
                query: {
                    bool: this.getAssignmentQuery(slugline, contentType),
                },
            }),
        })
            .then(
                (data) => {
                    if (get(data, '_items.length', 0) > 0) {
                        data._items.forEach(planningUtils.modifyForClient);
                        return Promise.resolve(data._items);
                    }

                    return Promise.resolve([]);
                },
                (error) => Promise.reject(error)
            );
    }

    showLinkAssignmentModal(item, assignments, resolve, reject) {
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

                        store.dispatch(
                            actions.assignments.ui.changeAssignmentListSingleGroupView('TODO')
                        );
                        store.dispatch(actions.assignments.api.setBaseQuery(
                            this.getAssignmentQuery(get(item, 'slugline'), get(item, 'type'))
                        ));
                        store.dispatch(actions.assignments.ui.preview(assignments[0]));

                        const onCancel = () => {
                            closeModal();
                            reject();
                        };

                        const onIgnore = () => {
                            closeModal();
                            resolve();
                        };

                        const $scope = {
                            resolve: () => {
                                closeModal();
                                resolve();
                            },
                            reject: reject,
                        };

                        store.dispatch(actions.showModal({
                            modalType: MODALS.FULFIL_ASSIGNMENT,
                            modalProps: {
                                newsItem: item,
                                fullscreen: true,
                                $scope: $scope, // Required by actions dispatches
                                onCancel: onCancel,
                                onIgnore: onIgnore,
                                showCancel: false,
                                showIgnore: true,
                                ignoreText: gettext('Don\'t Fulfil Assignment'),
                                title: gettext('Fulfil Assignment with this item?'),
                            },
                        }));
                    });
            });
    }
}

AssignmentsService.$inject = ['api', 'notify', 'modal', 'sdPlanningStore', 'deployConfig', 'desks'];
