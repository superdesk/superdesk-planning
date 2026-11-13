import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import sinon from 'sinon';
import moment from 'moment';

import {createTestStore, generateTempId} from '../../../../utils';
import {getTestActionStore, restoreSinonStub, waitFor} from '../../../../utils/testUtils';
import {EVENTS, PLANNING, ITEM_TYPE, WORKFLOW_STATE, POST_STATE} from '../../../../constants';

import * as selectors from '../../../../selectors';
import * as helpers from '../../../tests/helpers';
import {main, autosave} from '../../../../actions';

import {Editor} from '../../';
import {EditorComponent} from '../Editor';
import {EDITOR_TYPE, IEditorProps} from '../../../../interfaces';
import {planningApi, superdeskApi} from '../../../../superdeskApi';
import {
    EditorFieldEventRelatedPlanningsComponent,
} from '../../../fields/editor/EventRelatedPlannings/EventRelatedPlannings';

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

    it('cleans up only once when closing an unchanged editor while unlock is pending', async() => {
        const onCancel = sinon.spy();
        const editor = new EditorComponent({
            dispatch: astore.dispatch,
            itemType: ITEM_TYPE.EVENT,
            itemAction: 'edit',
            editorType: EDITOR_TYPE.INLINE,
            onCancel: onCancel,
        });

        editor.state = {
            ...editor.state,
            initialValues: item,
            diff: item,
        };
        sinon.stub(editor, 'setState');
        sinon.stub(editor.autoSave, 'flushAutosave').returns(Promise.resolve());

        let resolveUnlock: () => void;
        const unlocking = new Promise<[]>((resolve) => {
            resolveUnlock = () => resolve([]);
        });
        const unlockAndCancel = sinon.stub(editor.itemManager, 'unlockAndCancel').returns(unlocking);
        const closing = editor.cancelFromHeader();

        await Promise.resolve();
        expect(unlockAndCancel.callCount).toBe(1);

        resolveUnlock();
        await closing;
        await Promise.resolve();

        expect(unlockAndCancel.callCount).toBe(1);
        expect(onCancel.callCount).toBe(1);
    });

    it('cancels an unchanged temporary event with related plannings mounted', async() => {
        item._id = generateTempId();
        item.associated_plannings = [];
        delete item._etag;

        initStore();
        planningApi.redux.store = store;
        const profile = store.getState().forms.profiles.event;

        profile.editor = {
            dates: {enabled: false, all_day: {enabled: true}},
            related_plannings: {enabled: true, group: 'related_plannings', index: 0},
        };
        profile.groups = {
            related_plannings: {
                _id: 'related_plannings',
                name: 'Related Plannings',
                index: 0,
                useToggleBox: false,
            },
        };

        const autosaveGet = sinon.stub(planningApi.autosave, 'getById').resolves(item);
        const autosaveDelete = sinon.stub(planningApi.autosave, 'delete').resolves();
        const DropZone = superdeskApi.components.DropZone;

        Object.assign(superdeskApi.components, {
            DropZone: function DropZone({children}) {
                return <div>{children}</div>;
            },
        });

        try {
            const state = store.getState();
            const editorProps: IEditorProps = {
                itemType: 'event',
                session: selectors.general.session(state),
                privileges: selectors.general.privileges(state),
                lockedItems: selectors.locks.getLockedItems(state),
                users: selectors.general.users(state),
                formProfiles: state.forms.profiles,
                occurStatuses: selectors.vocabs.eventOccurStatuses(state),
                itemActions: {},
                showUnlock: false,
                hideItemActions: false,
                hideMinimize: false,
                createAndPost: false,
                newsCoverageStatus: selectors.general.newsCoverageStatus(state),
                contentTypes: selectors.general.contentTypes(state),
                inModalView: false,
                hideExternalEdit: false,
                defaultDesk: selectors.general.defaultDesk(state),
                currentWorkspace: selectors.general.currentWorkspace(state),
                editorType: EDITOR_TYPE.INLINE,
                groups: [],
                minimize: sinon.spy(),
                openCancelModal: sinon.spy(),
                notifyValidationErrors: sinon.spy(),
                saveDiffToStore: sinon.spy(),
                dispatch: store.dispatch,
            };

            wrapper = mount(
                <Provider store={store}>
                    <Editor {...editorProps} />
                </Provider>
            );
            store.dispatch(main.openEditorAction(item, 'edit', false));

            await waitFor(() => {
                wrapper.update();
                return wrapper.find(EditorFieldEventRelatedPlanningsComponent).length === 1;
            });

            const editor: EditorComponent = wrapper.find(EditorComponent).instance();
            const cleanup = sinon.spy(editor.itemManager, 'unlockAndCancel');

            expect(editor.isDirty(editor.state.initialValues, editor.state.diff)).toBe(false);
            expect(wrapper.find(EditorFieldEventRelatedPlanningsComponent).prop('disabled')).not.toBe(true);

            await editor.cancelFromHeader();
            wrapper.update();

            expect(cleanup.callCount).toBe(1);
            expect(autosaveDelete.callCount).toBe(1);
            expect(selectors.forms.currentItemId(store.getState())).toBe(null);
            expect(wrapper.find(EditorFieldEventRelatedPlanningsComponent).length).toBe(0);
            expect(editor.state.diff).toEqual({});
        } finally {
            if (wrapper != null) {
                wrapper.unmount();
            }
            autosaveGet.restore();
            autosaveDelete.restore();
            Object.assign(superdeskApi.components, {DropZone: DropZone});
        }
    });

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
