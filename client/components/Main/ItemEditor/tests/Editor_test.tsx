import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import sinon from 'sinon';
import moment from 'moment';

import {createTestStore} from '../../../../utils';
import {getTestActionStore, restoreSinonStub, waitFor} from '../../../../utils/testUtils';
import {EVENTS, PLANNING, ITEM_TYPE, WORKFLOW_STATE, POST_STATE} from '../../../../constants';

import * as selectors from '../../../../selectors';
import * as helpers from '../../../tests/helpers';
import {main, autosave} from '../../../../actions';

import {Editor} from '../../';

describe('Main.ItemEditor.Editor', () => {
    let store;
    let astore;
    let services;
    let data;
    let item;
    let wrapper;
    let buttons;
    let onSave;
    let onPost;
    let delay;

    beforeEach(() => {
        astore = getTestActionStore();
        services = astore.services;
        data = astore.data;

        item = data.events[0];
        item.dates.start = moment(item.dates.start);
        item.dates.end = moment(item.dates.end);
        item._startTime = item.dates.start;
        item._endTime = item.dates.end;
        item.lock_user = astore.initialState.session.identity._id;
        item.lock_session = astore.initialState.session.sessionId;
        item.lock_action = 'edit';
        item.lock_time = '2029-02-11T23:22:38+0000';
        item._etag = 'e123';

        // Mock an API call, allowing it to return after `delay`ms. This gives the tests time to determine
        // button states etc during `submitting=true`
        delay = 50;
        onSave = (resolve) => resolve(item);
        onPost = (resolve) => {
            item.state = WORKFLOW_STATE.SCHEDULED;
            item.pubstatus = POST_STATE.USABLE;

            store.dispatch({
                type: EVENTS.ACTIONS.ADD_EVENTS,
                payload: [item],
            });

            resolve(item);
        };

        sinon.stub(main, 'save').callsFake((item) => () => new Promise((resolve, reject) => setTimeout(
            () => onSave(resolve, reject)
        ), delay));
        sinon.stub(main, 'post').callsFake((item) => () => new Promise((resolve, reject) => setTimeout(
            () => onPost(resolve, reject)
        ), delay));

        sinon.stub(autosave, 'save').returns({type: 'test'});
    });

    afterEach(() => {
        restoreSinonStub(main.save);
        restoreSinonStub(main.post);
        restoreSinonStub(autosave.save);
    });

    const initStore = () => {
        astore.init();
        store = createTestStore({
            initialState: astore.initialState,
            extraArguments: {api: services.api},
        });

        if (item.lock_user) {
            item.type === ITEM_TYPE.EVENT ?
                store.dispatch({
                    type: EVENTS.ACTIONS.LOCK_EVENT,
                    payload: {event: item},
                }) :
                store.dispatch({
                    type: PLANNING.ACTIONS.LOCK_PLANNING,
                    planning: {plan: item},
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
                    session={selectors.general.session(state)}
                    privileges={selectors.general.privileges(state)}
                    lockedItems={selectors.locks.getLockedItems(state)}
                    addNewsItemToPlanning={null}
                    itemActions={{}}
                />
            </Provider>
        );

        store.dispatch(main.openEditorAction(item, 'edit'));
        updateButtons();
    };

    const updateButtons = () => {
        wrapper.update();
        const header = wrapper.find('.subnav');

        buttons = {
            cancel: new helpers.ui.Button(header, 'Cancel', 0, wrapper),
            close: new helpers.ui.Button(header, 'Close', 0, wrapper),
            savePost: new helpers.ui.Button(header, 'Save & Post', 0, wrapper),
            post: new helpers.ui.Button(header, 'Post', 0, wrapper),
            saveUnpost: new helpers.ui.Button(header, 'Save & Unpost', 0, wrapper),
            unpost: new helpers.ui.Button(header, 'Unpost', 0, wrapper),
            update: new helpers.ui.Button(header, 'Update', 0, wrapper),
            save: new helpers.ui.Button(header, 'Save', 0, wrapper),
            create: new helpers.ui.Button(header, 'Create', 0, wrapper),
            edit: new helpers.ui.Button(header, 'Edit', 0, wrapper),
        };
    };

    describe('Post', () => {
        xit('EditorHeader button states on posting', (done) => {
            setWrapper();

            // Check visible button states
            expect(buttons.close.isDisabled()).toBe(false);

            // Check buttons not mounted
            expect(buttons.post.isMounted).toBe(false);
            expect(buttons.save.isMounted).toBe(false);
            expect(buttons.cancel.isMounted).toBe(false);
            expect(buttons.savePost.isMounted).toBe(false);
            expect(buttons.saveUnpost.isMounted).toBe(false);
            expect(buttons.unpost.isMounted).toBe(false);
            expect(buttons.update.isMounted).toBe(false);
            expect(buttons.create.isMounted).toBe(false);
            expect(buttons.edit.isMounted).toBe(false);

            waitFor(() => {
                updateButtons();
                return buttons.post.isMounted;
            })
                .then(() => {
                    buttons.post.click();
                    wrapper.update();

                    return waitFor(() => main.post.callCount > 0);
                })
                .then(() => {
                    expect(main.post.callCount).toBe(1);
                    expect(main.post.args[0]).toEqual([item]);

                    // Ensure the buttons are disabled when submitting the form
                    updateButtons();
                    expect(buttons.close.isDisabled()).toBe(true);
                    expect(buttons.post.isDisabled()).toBe(true);
                    expect(buttons.save.isDisabled()).toBe(true);

                    return waitFor(() => {
                        updateButtons();
                        return !buttons.close.isDisabled();
                    });
                })
                .then(() => {
                    updateButtons();

                    // Check that button types are changed once posted
                    expect(buttons.post.isMounted).toBe(false);
                    expect(buttons.unpost.isMounted).toBe(true);
                    expect(buttons.save.isMounted).toBe(false);
                    expect(buttons.update.isMounted).toBe(true);

                    // Check the button states once again
                    expect(buttons.close.isDisabled()).toBe(false);
                    expect(buttons.unpost.isDisabled()).toBe(false);
                    expect(buttons.update.isDisabled()).toBe(true);
                    done();
                })
                .catch(done.fail);
        });

        xit('EditorHeader button states on posting error', (done) => {
            setWrapper();

            // Mock post error function
            onPost = (resolve, reject) => reject('Failed to post');

            waitFor(() => {
                updateButtons();
                return buttons.post.isMounted;
            })
                .then(() => {
                    buttons.post.click();
                    expect(main.post.callCount).toBe(1);
                    expect(main.post.args[0]).toEqual([item]);

                    // Ensure the buttons are disabled when submitting the form
                    updateButtons();
                    expect(buttons.close.isDisabled()).toBe(true);
                    expect(buttons.post.isDisabled()).toBe(true);
                    expect(buttons.save.isDisabled()).toBe(true);

                    return waitFor(() => {
                        updateButtons();
                        return !buttons.close.isDisabled();
                    });
                })
                .then(() => {
                    updateButtons();

                    // Check that button types are changed back on api error
                    expect(buttons.post.isMounted).toBe(true);
                    expect(buttons.unpost.isMounted).toBe(false);
                    expect(buttons.save.isMounted).toBe(true);
                    expect(buttons.update.isMounted).toBe(false);

                    // Check the button states once again
                    expect(buttons.close.isDisabled()).toBe(false);
                    expect(buttons.post.isDisabled()).toBe(false);
                    expect(buttons.save.isDisabled()).toBe(true);
                    done();
                })
                .catch(done.fail);
        });

        xit('Shows validation errors', (done) => {
            setWrapper();

            waitFor(() => {
                updateButtons();
                return buttons.save.isMounted;
            })
                .then(() => {
                    const nameFieldBeforeError = wrapper.find('.sd-line-input--required').first();

                    expect(nameFieldBeforeError.hasClass('sd-line-input--invalid')).toBe(false);
                    nameFieldBeforeError.find('[name="name"]')
                        .simulate('change', {target: {value: ''}});
                    const nameFieldAfterError = wrapper.find('.sd-line-input--required').first();

                    expect(nameFieldAfterError.hasClass('sd-line-input--invalid')).toBe(true);
                    expect(nameFieldAfterError.find('.sd-line-input__message').text())
                        .toBe('This field is required');
                    done();
                })
                .catch(done.fail);
        });
    });
});
