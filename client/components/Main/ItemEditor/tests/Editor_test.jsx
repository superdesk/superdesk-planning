import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import sinon from 'sinon';
import moment from 'moment';

import {createTestStore} from '../../../../utils';
import {getTestActionStore, restoreSinonStub, waitFor} from '../../../../utils/testUtils';
import {EVENTS, PLANNING, ITEM_TYPE, WORKFLOW_STATE, PUBLISHED_STATE} from '../../../../constants';

import * as selectors from '../../../../selectors';
import * as helpers from '../../../tests/helpers';
import {main} from '../../../../actions';

import {Editor} from '../';

describe('Main.ItemEditor.Editor', () => {
    let store;
    let astore;
    let services;
    let data;
    let item;
    let wrapper;
    let buttons;
    let onSave;
    let onPublish;
    let delay;

    beforeEach(() => {
        astore = getTestActionStore();
        services = astore.services;
        data = astore.data;

        item = data.events[0];
        item.dates.start = moment(item.dates.start);
        item.dates.end = moment(item.dates.end);
        item.lock_user = astore.initialState.session.identity._id;
        item.lock_session = astore.initialState.session.sessionId;
        item.lock_action = 'edit';
        item.lock_time = '2029-02-11T23:22:38+0000';
        item._etag = 'e123';

        // Mock an API call, allowing it to return after `delay`ms. This gives the tests time to determine
        // button states etc during `submitting=true`
        delay = 50;
        onSave = (resolve) => resolve(item);
        onPublish = (resolve) => {
            item.state = WORKFLOW_STATE.SCHEDULED;
            item.pubstatus = PUBLISHED_STATE.USABLE;

            store.dispatch({
                type: EVENTS.ACTIONS.ADD_EVENTS,
                payload: [item]
            });

            resolve(item);
        };

        sinon.stub(main, 'save').callsFake((item) => () => new Promise((resolve, reject) => setTimeout(
            () => onSave(resolve, reject)
        ), delay));
        sinon.stub(main, 'publish').callsFake((item) => () => new Promise((resolve, reject) => setTimeout(
            () => onPublish(resolve, reject)
        ), delay));
    });

    afterEach(() => {
        restoreSinonStub(main.save);
        restoreSinonStub(main.publish);
    });

    const initStore = () => {
        astore.init();
        store = createTestStore({
            initialState: astore.initialState,
            extraArguments: {api: services.api}
        });

        if (item.lock_user) {
            item.type === ITEM_TYPE.EVENT ?
                store.dispatch({
                    type: EVENTS.ACTIONS.LOCK_EVENT,
                    payload: {event: item}
                }) :
                store.dispatch({
                    type: PLANNING.ACTIONS.LOCK_PLANNING,
                    planning: {plan: item}
                });
        }

        return store;
    };

    // Update the button instances to get their latest states
    const setWrapper = () => {
        initStore();
        const state = store.getState();

        wrapper = mount(
            <Provider store={store}>
                <Editor
                    session={selectors.getSessionDetails(state)}
                    privileges={selectors.getPrivileges(state)}
                    lockedItems={selectors.locks.getLockedItems(state)}
                    addNewsItemToPlanning={null}
                    itemActions={{}}
                    currentWorkspace={selectors.getCurrentWorkspace(state)}
                />
            </Provider>
        );

        store.dispatch(main.openEditor(item));
        updateButtons();
    };

    const updateButtons = () => {
        wrapper.update();
        const header = wrapper.find('.subnav');

        buttons = {
            cancel: new helpers.ui.Button(header, 'Cancel', 0, wrapper),
            close: new helpers.ui.Button(header, 'Close', 0, wrapper),
            savePublish: new helpers.ui.Button(header, 'Save & Publish', 0, wrapper),
            publish: new helpers.ui.Button(header, 'Publish', 0, wrapper),
            saveUnpublish: new helpers.ui.Button(header, 'Save & Unpublish', 0, wrapper),
            unpublish: new helpers.ui.Button(header, 'Unpublish', 0, wrapper),
            update: new helpers.ui.Button(header, 'Update', 0, wrapper),
            save: new helpers.ui.Button(header, 'Save', 0, wrapper),
            create: new helpers.ui.Button(header, 'Create', 0, wrapper),
            edit: new helpers.ui.Button(header, 'Edit', 0, wrapper),
        };
    };

    describe('Publish', () => {
        // TODO: To be revisited
        xit('EditorHeader button states on publishing', (done) => {
            setWrapper();

            // Check visible button states
            expect(buttons.close.isDisabled()).toBe(false);
            expect(buttons.publish.isDisabled()).toBe(false);
            expect(buttons.save.isDisabled()).toBe(true);

            // Check buttons not mounted
            expect(buttons.cancel.isMounted).toBe(false);
            expect(buttons.savePublish.isMounted).toBe(false);
            expect(buttons.saveUnpublish.isMounted).toBe(false);
            expect(buttons.unpublish.isMounted).toBe(false);
            expect(buttons.update.isMounted).toBe(false);
            expect(buttons.create.isMounted).toBe(false);
            expect(buttons.edit.isMounted).toBe(false);

            buttons.publish.click();
            expect(main.publish.callCount).toBe(1);
            expect(main.publish.args[0]).toEqual([item]);

            // Ensure the buttons are disabled when submitting the form
            expect(buttons.close.isDisabled()).toBe(true);
            expect(buttons.publish.isDisabled()).toBe(true);
            expect(buttons.save.isDisabled()).toBe(true);

            waitFor(() => wrapper.update() && buttons.close.isDisabled() === false)
                .then(() => {
                    updateButtons();

                    // Check that button types are changed once published
                    expect(buttons.publish.isMounted).toBe(false);
                    expect(buttons.unpublish.isMounted).toBe(true);
                    expect(buttons.save.isMounted).toBe(false);
                    expect(buttons.update.isMounted).toBe(true);

                    // Check the button states once again
                    expect(buttons.close.isDisabled()).toBe(false);
                    expect(buttons.unpublish.isDisabled()).toBe(false);
                    expect(buttons.update.isDisabled()).toBe(true);
                    done();
                });
        });

        // TODO: To be revisited
        xit('EditorHeader button states on publishing error', (done) => {
            setWrapper();

            // Mock publish error function
            onPublish = (resolve, reject) => reject('Failed to publish');

            buttons.publish.click();
            expect(main.publish.callCount).toBe(1);
            expect(main.publish.args[0]).toEqual([item]);

            // Ensure the buttons are disabled when submitting the form
            expect(buttons.close.isDisabled()).toBe(true);
            expect(buttons.publish.isDisabled()).toBe(true);
            expect(buttons.save.isDisabled()).toBe(true);

            waitFor(() => wrapper.update() && buttons.close.isDisabled() === false)
                .then(() => {
                    updateButtons();

                    // Check that button types are changed back on api error
                    expect(buttons.publish.isMounted).toBe(true);
                    expect(buttons.unpublish.isMounted).toBe(false);
                    expect(buttons.save.isMounted).toBe(true);
                    expect(buttons.update.isMounted).toBe(false);

                    // Check the button states once again
                    expect(buttons.close.isDisabled()).toBe(false);
                    expect(buttons.publish.isDisabled()).toBe(false);
                    expect(buttons.save.isDisabled()).toBe(true);
                    done();
                });
        });
    });
});
