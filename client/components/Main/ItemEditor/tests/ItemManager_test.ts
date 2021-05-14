import sinon from 'sinon';
import {cloneDeep} from 'lodash';
import moment from 'moment-timezone';

import {appConfig} from 'appConfig';

import {main, locks} from '../../../../actions';
import eventsApi from '../../../../actions/events/api';
import planningApi from '../../../../actions/planning/api';
import planningUi from '../../../../actions/planning/ui';

import {EVENTS} from '../../../../constants';
import {getItemInArrayById, itemsEqual, timeUtils, updateFormValues, removeAutosaveFields} from '../../../../utils';
import {restoreSinonStub, waitFor} from '../../../../utils/testUtils';
import * as testData from '../../../../utils/testData';

import {ItemManager} from '../ItemManager';


describe('components.Main.ItemManager', () => {
    let editor;
    let manager;
    let newEvent;
    let newPlan;
    let states;

    beforeEach(() => {
        newEvent = {
            _id: 'tempId-e5',
            type: 'event',
            occur_status: {
                qcode: 'eocstat:eos5',
                name: 'Planned, occurs certainly',
                label: 'Confirmed',
            },
            dates: {
                start: null,
                end: null,
                tz: 'Australia/Sydney',
            },
            calendars: undefined,
            state: 'draft',
            language: 'en',
        };

        newPlan = {
            _id: 'tempId-p5',
            type: 'planning',
            state: 'draft',
            planning_date: jasmine.any(moment),
            agendas: [],
            flags: {
                marked_for_not_publication: false,
                overide_auto_assign_to_workflow: false,
            },
            item_class: 'plinat:newscoverage',
            coverages: [],
            language: 'en',
        };

        states = {
            loading: {
                itemReady: false,
                tab: 0,
                loading: true,
                initialValues: {},
                diff: {},
            },
            notLoading: {
                submitting: false,
                itemReady: true,
                loading: false,
            },
        };

        editor = {
            props: {
                dispatch: sinon.spy((rtn) => rtn),
                itemId: null,
                itemType: null,
                itemAction: null,
                item: null,
                initialValues: null,
                notifyValidationErrors: sinon.spy(),
                session: testData.sessions[0],
                currentWorkspace: testData.workspace.currentWorkspace,
                inModalView: false,
                newsCoverageStatus: null,
                defaultDesk: null,
                preferredCoverageDesks: null,
                onCancel: null,

                occurStatuses: testData.vocabularies.eventoccurstatus,
                defaultCalendar: [],
                defaultPlace: [],
                saveDiffToStore: sinon.spy(),
            },
            state: {},
            setState: sinon.spy((newState, cb) => {
                editor.state = {
                    ...cloneDeep(editor.state),
                    ...cloneDeep(newState),
                };

                if (cb) {
                    cb();
                }
            }),
            autoSave: {
                flushAutosave: sinon.stub().returns(Promise.resolve()),
                createOrLoadAutosave: sinon.spy(
                    (nextProps, diff) => Promise.resolve(diff)
                ),
                remove: sinon.stub().returns(Promise.resolve()),
                saveAutosave: sinon.stub(),
            },
            isDirty: (initialValues, diff) => (
                !itemsEqual(diff, initialValues)
            ),
            onCancel: sinon.spy(() => {
                if (editor.props.onCancel) {
                    editor.props.onCancel();
                }

                return manager.unlockAndCancel();
            }),
            onChangeHandler: sinon.spy((field, value) => {
                const diff = field ? Object.assign({}, editor.state.diff) : cloneDeep(value);

                if (field) {
                    updateFormValues(diff, field, value);
                }

                editor.setState({diff});
            }),
            closeEditor: sinon.spy(),
        };

        manager = new ItemManager(editor);
        manager.mounted = true;

        sinon.stub(main, 'openEditorAction');
        sinon.stub(timeUtils, 'localTimeZone').returns(appConfig.defaultTimezone);
    });

    afterEach(() => {
        restoreSinonStub(main.openEditorAction);
        restoreSinonStub(timeUtils.localTimeZone);
    });

    const updateProps = (newProps) => {
        editor.props = {...editor.props, ...newProps};
    };

    const expectState = (state) => {
        Object.keys(state).forEach(
            (key) => {
                expect(editor.state[key]).toEqual(state[key]);
            }
        );
    };

    it('can get props from the editor', () => {
        const props = {
            itemId: 'e1',
            itemType: 'event',
            itemAction: 'read',
            initialValues: testData.events[0],
        };

        editor.props = props;
        expect(manager.props).toEqual(props);
    });

    describe('editor.state', () => {
        const state = {
            diff: {},
            errors: {},
            loading: true,
        };

        it('can get state from the editor', () => {
            editor.state = state;
            expect(manager.state).toEqual(state);
        });

        it('calls editor.setState', () => {
            manager.setState(state);
            expect(editor.setState.callCount).toBe(1);
            expect(editor.setState.args[0][0]).toEqual(state);
        });

        it('executes callback after setting the state', (done) => {
            const cb = sinon.spy();

            manager.setState(state, cb)
                .then(() => {
                    expect(cb.callCount).toBe(1);
                    done();
                })
                .catch(done.fail);
        });
    });

    it('default state', () => {
        expect(editor.state).toEqual({
            tab: 0,
            diff: {},
            errors: {},
            errorMessages: [],
            dirty: false,
            submitting: false,
            submitFailed: false,
            partialSave: false,
            itemReady: false,
            loading: false,
            initialValues: {},
        });
    });

    describe('componentWillMount', () => {
        beforeEach(() => {
            sinon.stub(manager, 'onItemIDChanged');
        });

        afterEach(() => {
            restoreSinonStub(manager.onItemIDChanged);
        });

        it('on mount does nothing if no item is selected', () => {
            manager.componentWillMount();
            expect(manager.onItemIDChanged.callCount).toBe(0);
        });

        it('on mount open for creating', () => {
            const nextProps = {
                itemId: 'tempId-e5',
                itemType: 'event',
                itemAction: 'create',
                initialValues: {
                    _id: 'tempId-e5',
                    type: 'event',
                },
            };

            updateProps(nextProps);
            manager.componentWillMount();
            expect(manager.onItemIDChanged.callCount).toBe(1);
            expect(manager.onItemIDChanged.args[0]).toEqual([
                jasmine.objectContaining(nextProps),
            ]);
        });

        it('on mount open for editing', () => {
            const nextProps = {
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'edit',
                initialValues: testData.events[0],
            };

            updateProps(nextProps);
            manager.componentWillMount();
            expect(manager.onItemIDChanged.callCount).toBe(1);
            expect(manager.onItemIDChanged.args[0]).toEqual([
                jasmine.objectContaining(nextProps),
            ]);
        });

        it('on mount open for read only', () => {
            const nextProps = {
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'read',
                initialValues: testData.events[0],
            };

            updateProps(nextProps);
            manager.componentWillMount();
            expect(manager.onItemIDChanged.callCount).toBe(1);
            expect(manager.onItemIDChanged.args[0]).toEqual([
                jasmine.objectContaining(nextProps),
            ]);
        });
    });

    it('openInModal', (done) => {
        editor.state.initialValues = cloneDeep(testData.events[0]);

        manager.openInModal()
            .then(() => {
                expect(editor.autoSave.flushAutosave.callCount).toBe(1);

                expect(main.openEditorAction.callCount).toBe(1);
                expect(main.openEditorAction.args[0]).toEqual([
                    editor.state.initialValues,
                    'edit',
                    false,
                    true,
                ]);

                done();
            })
            .catch(done.fail);
    });

    describe('componentWillReceiveProps', () => {
        beforeEach(() => {
            sinon.stub(manager, 'clearForm');
            sinon.stub(manager, 'onItemIDChanged');
            sinon.stub(manager, 'onItemChanged');
        });

        afterEach(() => {
            restoreSinonStub(manager.clearForm);
            restoreSinonStub(manager.onItemIDChanged);
            restoreSinonStub(manager.onItemChanged);
        });

        it('flushes autosave and clears form the closing the editor', () => {
            const prevProps = {...editor.props};

            editor.props = {};
            manager.componentDidUpdate(prevProps);

            expect(editor.autoSave.flushAutosave.callCount).toBe(1);
            expect(manager.clearForm.callCount).toBe(1);
        });

        it('calls onItemIDChanged', () => {
            updateProps({
                itemId: 'e2',
                itemType: 'event',
                itemAction: 'edit',
            });

            manager.componentDidUpdate({
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'edit',
            });

            expect(manager.onItemIDChanged.callCount).toBe(1);
            expect(manager.onItemIDChanged.args[0]).toEqual([jasmine.objectContaining({
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'edit',
            })]);
        });

        it('calls on action changed', () => {
            updateProps({
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'edit',
            });

            manager.componentDidUpdate({
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'read',
            });

            waitFor(() => manager.onItemIDChanged.callCount > 0)
                .then(() => {
                    expect(manager.onItemIDChanged.callCount).toBe(1);
                    expect(manager.onItemIDChanged.args[0]).toEqual([jasmine.objectContaining({
                        itemId: 'e1',
                        itemType: 'event',
                        itemAction: 'read',
                    })]);
                });
        });

        it('calls editor.autoSave.remove on action revert to read', () => {
            updateProps({
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'read',
            });

            manager.componentDidUpdate({
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'edit',
            });

            expect(editor.autoSave.remove.callCount).toBe(1);
        });

        it('calls onItemChanged', () => {
            updateProps({
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'read',
                item: testData.events[0],
            });

            manager.componentDidUpdate({
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'read',
                item: {
                    ...testData.events[0],
                    slugline: 'slugger',
                },
            });

            expect(manager.onItemChanged.callCount).toBe(1);
            expect(manager.onItemChanged.args[0]).toEqual([jasmine.objectContaining({
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'read',
                item: testData.events[0],
            })]);
        });
    });

    describe('onItemIDChanged', () => {
        beforeEach(() => {
            sinon.spy(manager, 'createNew');
            sinon.spy(manager, 'loadItem');
            sinon.spy(manager, 'loadReadOnlyItem');

            sinon.stub(locks, 'lock').callsFake(
                (original) => Promise.resolve(original)
            );
            sinon.stub(main, 'fetchById').callsFake((itemId, itemType) => (
                Promise.resolve(
                    getItemInArrayById(
                        itemType === 'event' ?
                            testData.events :
                            testData.plannings,
                        itemId
                    )
                )
            ));
        });

        afterEach(() => {
            restoreSinonStub(manager.createNew);
            restoreSinonStub(manager.loadItem);
            restoreSinonStub(manager.loadReadOnlyItem);
            restoreSinonStub(main.fetchById);
            restoreSinonStub(locks.lock);
        });

        it('createNew Event', (done) => {
            const prevProps = cloneDeep(editor.props);

            updateProps({
                itemId: 'tempId-e5',
                itemType: 'event',
                itemAction: 'create',
                initialValues: {
                    _id: 'tempId-e5',
                    type: 'event',
                },
            });
            manager.onItemIDChanged(prevProps);
            expectState(states.loading);

            waitFor(() => manager.createNew.callCount > 0)
                .then(() => {
                    expect(manager.createNew.callCount).toBe(1);
                    expect(manager.createNew.args[0]).toEqual([editor.props]);
                    expectState({
                        ...states.notLoading,
                        diff: {
                            ...newEvent,
                            place: [],
                            associated_plannings: [],
                            calendars: [],
                        },
                        initialValues: {
                            ...newEvent,
                            _startTime: null,
                            _endTime: null,
                            place: [],
                            calendars: [],
                        },
                        dirty: false,
                    });

                    done();
                })
                .catch(done.fail);
        });

        it('createNew Planning', (done) => {
            const prevProps = cloneDeep(editor.props);

            updateProps({
                itemId: 'tempId-p5',
                itemType: 'planning',
                itemAction: 'create',
                initialValues: {
                    _id: 'tempId-p5',
                    type: 'planning',
                },
            });

            manager.onItemIDChanged(prevProps);
            expectState(states.loading);

            waitFor(() => manager.createNew.callCount > 0)
                .then(() => {
                    expect(manager.createNew.callCount).toBe(1);
                    expect(manager.createNew.args[0]).toEqual([editor.props]);

                    expectState({
                        ...states.notLoading,
                        diff: {
                            ...newPlan,
                            place: [],
                        },
                        initialValues: {
                            ...newPlan,
                            place: [],
                        },
                        dirty: false,
                    });

                    done();
                })
                .catch(done.fail);
        });

        it('edit existing item', (done) => {
            const prevProps = cloneDeep(editor.props);

            updateProps({
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'edit',
                initialValues: testData.events[0],
            });

            manager.onItemIDChanged(prevProps);
            expectState(states.loading);

            waitFor(() => manager.loadItem.callCount > 0)
                .then(() => {
                    expect(manager.loadItem.callCount).toBe(1);
                    expect(manager.loadItem.args[0]).toEqual([editor.props]);

                    expectState(states.notLoading);

                    expect(main.fetchById.callCount).toBe(1);
                    expect(main.fetchById.args[0]).toEqual(['e1', 'event', true]);

                    expect(locks.lock.callCount).toBe(1);
                    expect(locks.lock.args[0]).toEqual([testData.events[0]]);

                    expect(editor.autoSave.createOrLoadAutosave.callCount).toBe(1);
                    expect(editor.autoSave.createOrLoadAutosave.args[0]).toEqual([
                        editor.props,
                        testData.events[0],
                    ]);

                    expectState({
                        initialValues: testData.events[0],
                        diff: {
                            ...testData.events[0],
                            associated_plannings: [testData.plannings[1]],
                        },
                        dirty: false,
                    });

                    done();
                })
                .catch(done.fail);
        });

        it('opens item in read only mode', (done) => {
            const prevProps = cloneDeep(editor.props);

            updateProps({
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'read',
                initialValues: testData.events[0],
            });
            manager.onItemIDChanged(prevProps);
            expectState(states.loading);

            waitFor(() => manager.loadReadOnlyItem.callCount > 0)
                .then(() => {
                    expect(manager.loadReadOnlyItem.callCount).toBe(1);
                    expect(manager.loadReadOnlyItem.args[0]).toEqual([editor.props]);
                    expectState(states.notLoading);

                    expect(main.fetchById.callCount).toBe(1);
                    expect(main.fetchById.args[0]).toEqual([
                        'e1',
                        'event',
                        true,
                    ]);

                    expect(locks.lock.callCount).toBe(0);

                    expectState({
                        initialValues: testData.events[0],
                        diff: testData.events[0],
                        dirty: false,
                    });

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('onItemChanged', () => {
        beforeEach(() => {
            sinon.stub(manager, 'resetForm');
        });

        afterEach(() => {
            restoreSinonStub(manager.resetForm);
        });

        it('calls resetForm if the editor is in read-only mode', () => {
            updateProps({
                itemAction: 'edit',
                item: testData.events[0],
            });

            manager.onItemChanged(editor.props);
            expect(manager.resetForm.callCount).toBe(0);

            updateProps({itemAction: 'read'});
            manager.onItemChanged(editor.props);
            expect(manager.resetForm.callCount).toBe(1);
            expect(manager.resetForm.args[0]).toEqual([testData.events[0]]);
        });
    });

    describe('createNew', () => {
        beforeEach(() => {
            editor.setState(states.loading);
        });

        it('sets default event attributes', (done) => {
            const nextProps = {
                itemId: 'tempId-e5',
                itemType: 'event',
                itemAction: 'create',
                initialValues: {
                    _id: 'tempId-e5',
                    type: 'event',
                },
            };

            manager.createNew(nextProps)
                .then(() => {
                    expect(editor.autoSave.createOrLoadAutosave.callCount).toBe(1);
                    expect(editor.autoSave.createOrLoadAutosave.args[0]).toEqual([
                        nextProps,
                        {...newEvent, _startTime: null, _endTime: null},
                    ]);

                    expectState({
                        initialValues: {...newEvent, _startTime: null, _endTime: null},
                        diff: {...newEvent, associated_plannings: []},
                        submitting: false,
                        itemReady: true,
                        loading: false,
                        dirty: false,
                    });

                    done();
                })
                .catch(done.fail);
        });

        it('sets default planning attributes', (done) => {
            const nextProps = {
                itemId: 'tempId-p5',
                itemType: 'planning',
                itemAction: 'create',
                initialValues: {
                    _id: 'tempId-p5',
                    type: 'planning',
                },
            };

            manager.createNew(nextProps)
                .then(() => {
                    expect(editor.autoSave.createOrLoadAutosave.callCount).toBe(1);
                    expect(editor.autoSave.createOrLoadAutosave.args[0]).toEqual([
                        nextProps,
                        newPlan,
                    ]);

                    expectState({
                        initialValues: newPlan,
                        diff: newPlan,
                        submitting: false,
                        itemReady: true,
                        loading: false,
                        dirty: false,
                    });

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('loadReadOnlyItem', () => {
        beforeEach(() => {
            sinon.stub(main, 'fetchById').returns(Promise.resolve(testData.events[0]));
            editor.setState(states.loading);
        });

        afterEach(() => {
            restoreSinonStub(main.fetchById);
        });

        it('calls fetchById and sets the editor state', (done) => {
            manager.loadReadOnlyItem({
                itemId: 'e1',
                itemType: 'event',
            })
                .then(() => {
                    expect(main.fetchById.callCount).toBe(1);
                    expect(main.fetchById.args[0]).toEqual(['e1', 'event', true]);

                    expectState({
                        initialValues: testData.events[0],
                        diff: testData.events[0],
                        dirty: false,
                        submitting: false,
                        itemReady: true,
                        loading: false,
                    });

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('loadItem', () => {
        let lockedItem;

        beforeEach(() => {
            lockedItem = {
                ...cloneDeep(testData.events[0]),
                _etag: 'e789',
                lock_action: 'edit',
                lock_user: testData.sessions[0].identity._id,
                lock_session: testData.sessions[0].sessionId,
                lock_time: jasmine.any(moment),
            };

            editor.setState(states.loading);
            sinon.stub(main, 'fetchById').returns(Promise.resolve(testData.events[0]));
            sinon.stub(locks, 'lock').returns(Promise.resolve(lockedItem));
            sinon.stub(manager, 'addCoverage');
            sinon.stub(manager, 'changeAction');
        });

        afterEach(() => {
            restoreSinonStub(main.fetchById);
            restoreSinonStub(locks.lock);
            restoreSinonStub(manager.addCoverage);
            restoreSinonStub(manager.changeAction);
        });

        it('loads a new item', (done) => {
            const nextProps = {
                itemId: newEvent._id,
                itemType: newEvent.type,
                itemAction: 'create',
                initialValues: newEvent,
            };

            updateProps(nextProps);
            manager.loadItem(editor.props)
                .then(() => {
                    expect(main.fetchById.callCount).toBe(0);
                    expect(locks.lock.callCount).toBe(0);

                    expect(editor.autoSave.createOrLoadAutosave.callCount).toBe(1);
                    expect(editor.autoSave.createOrLoadAutosave.args[0]).toEqual([
                        jasmine.objectContaining(nextProps),
                        newEvent,
                    ]);

                    expectState({
                        initialValues: newEvent,
                        diff: {
                            ...newEvent,
                            associated_plannings: [],
                        },
                        dirty: false,
                        submitting: false,
                        itemReady: true,
                        loading: false,
                    });

                    done();
                })
                .catch(done.fail);
        });

        it('loads and locks an existing item', (done) => {
            const nextProps = {
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'edit',
                initialValues: testData.events[0],
            };

            updateProps(nextProps);
            manager.loadItem(editor.props)
                .then(() => {
                    expect(main.fetchById.callCount).toBe(1);
                    expect(main.fetchById.args[0]).toEqual(['e1', 'event', true]);

                    expect(locks.lock.callCount).toBe(1);
                    expect(locks.lock.args[0]).toEqual([testData.events[0]]);

                    expect(editor.autoSave.createOrLoadAutosave.callCount).toBe(1);
                    expect(editor.autoSave.createOrLoadAutosave.args[0]).toEqual([
                        jasmine.objectContaining(nextProps),
                        lockedItem,
                    ]);

                    expectState({
                        initialValues: lockedItem,
                        diff: lockedItem,
                        dirty: false,
                        submitting: false,
                        itemReady: true,
                        loading: false,
                    });

                    done();
                })
                .catch(done.fail);
        });

        it('loads an existing item in read-only mode', (done) => {
            const nextProps = {
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'read',
                initialValues: testData.events[0],
            };

            updateProps(nextProps);
            manager.loadItem(editor.props)
                .then(() => {
                    expect(main.fetchById.callCount).toBe(1);
                    expect(main.fetchById.args[0]).toEqual(['e1', 'event', true]);
                    expect(locks.lock.callCount).toBe(0);

                    expectState({
                        initialValues: testData.events[0],
                        diff: testData.events[0],
                        dirty: false,
                        submitting: false,
                        itemReady: true,
                        loading: false,
                    });

                    done();
                })
                .catch(done.fail);
        });

        it('adds coverage when using in addToPlanning modal', (done) => {
            const coverage = {
                coverage_id: 'c5',
                planning_item: 'p1',
                planning: {
                    ednote: 'Video coverage',
                    scheduled: '2016-10-15T13:01:11',
                    g2_content_type: 'video',
                    genre: null,
                },
            };
            const nextProps = {
                itemId: 'p1',
                itemType: 'planning',
                itemAction: 'create',
                initialValues: {
                    ...cloneDeep(testData.plannings[0]),
                    _addCoverage: coverage,
                },
            };

            updateProps(nextProps);
            manager.loadItem(editor.props)
                .then(() => {
                    setTimeout(() => {
                        expect(manager.addCoverage.callCount).toBe(1);
                        expect(manager.addCoverage.args[0]).toEqual([coverage]);

                        done();
                    }, 0);
                })
                .catch(done.fail);
        });

        it('changes the editor to read-only on failure', (done) => {
            restoreSinonStub(locks.lock);
            sinon.stub(locks, 'lock').returns(Promise.reject());

            const nextProps = {
                itemId: 'e1',
                itemType: 'event',
                itemAction: 'edit',
                initialValues: testData.events[0],
            };

            updateProps(nextProps);
            manager.loadItem(editor.props)
                .then(() => {
                    expect(manager.changeAction.callCount).toBe(1);
                    expect(manager.changeAction.args[0]).toEqual(['read']);

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('_saveFromAuthoring', () => {
        beforeEach(() => {
            sinon.stub(main, 'save').returns(Promise.resolve());
            sinon.stub(manager, 'unlockAndCancel').returns(Promise.resolve());
        });

        afterEach(() => {
            restoreSinonStub(main.save);
            restoreSinonStub(manager.unlockAndCancel);
        });

        it('creates and posts and item from authoring', (done) => {
            updateProps({itemId: newPlan._id});
            editor.setState({
                initialValues: cloneDeep(newPlan),
                diff: cloneDeep(newPlan),
            });

            manager._saveFromAuthoring({post: true})
                .then(() => {
                    expect(main.save.callCount).toBe(1);
                    expect(main.save.args[0]).toEqual([
                        {},
                        {
                            ...newPlan,
                            state: 'scheduled',
                            pubstatus: 'usable',
                            _post: true,
                        },
                        false,
                    ]);

                    expect(manager.unlockAndCancel.callCount).toBe(1);

                    done();
                })
                .catch(done.fail);
        });

        it('creates and unposts and item from authoring', (done) => {
            updateProps({itemId: newPlan._id});
            editor.setState({
                initialValues: cloneDeep(newPlan),
                diff: cloneDeep(newPlan),
            });

            manager._saveFromAuthoring({unpost: true})
                .then(() => {
                    expect(main.save.callCount).toBe(1);
                    expect(main.save.args[0]).toEqual([
                        {},
                        {
                            ...newPlan,
                            state: 'killed',
                            pubstatus: 'cancelled',
                        },
                        false,
                    ]);

                    expect(manager.unlockAndCancel.callCount).toBe(1);

                    done();
                })
                .catch(done.fail);
        });

        it('updates an item from authoring', (done) => {
            updateProps({itemId: testData.plannings[0]._id});
            editor.setState({
                initialValues: cloneDeep(testData.plannings[0]),
                diff: {
                    ...cloneDeep(testData.plannings[0]),
                    slugline: 'linked to content',
                },
            });

            manager._saveFromAuthoring()
                .then(() => {
                    expect(main.save.callCount).toBe(1);
                    expect(main.save.args[0]).toEqual([
                        testData.plannings[0],
                        {
                            ...testData.plannings[0],
                            slugline: 'linked to content',
                        },
                        false,
                    ]);

                    expect(manager.unlockAndCancel.callCount).toBe(1);

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('_save', () => {
        let item;

        beforeEach(() => {
            sinon.stub(main, 'save').callsFake(() => Promise.resolve(item));
            sinon.stub(manager, 'changeAction');
            sinon.stub(manager, 'unlockAndCancel');
            sinon.stub(manager, '_saveFromAuthoring');
            sinon.stub(planningApi, 'unlock');
        });

        afterEach(() => {
            restoreSinonStub(main.save);
            restoreSinonStub(manager.changeAction);
            restoreSinonStub(manager.unlockAndCancel);
            restoreSinonStub(manager._saveFromAuthoring);
            restoreSinonStub(planningApi.unlock);
        });

        it('returns without saving if there are validation errors', (done) => {
            editor.setState({errorMessages: ['something bad']});

            manager._save()
                .then(done.fail, () => {
                    expect(main.save.callCount).toBe(0);
                    expect(editor.state.submitFailed).toBeTruthy();
                    expect(editor.props.notifyValidationErrors.callCount).toBe(1);
                    expect(editor.props.notifyValidationErrors.args[0]).toEqual([
                        ['something bad'],
                    ]);

                    done();
                })
                .catch(done.fail);
        });

        it('calls _saveFromAuthoring if props.addNewsItemToPlanning', (done) => {
            updateProps({addNewsItemToPlanning: true});
            manager._save()
                .then(() => {
                    expect(manager._saveFromAuthoring.callCount).toBe(1);
                    expect(manager._saveFromAuthoring.args[0]).toEqual([{post: false, unpost: false}]);
                    expect(main.save.callCount).toBe(0);

                    done();
                })
                .catch(done.fail);
        });

        it('creates a new item', (done) => {
            item = newEvent;
            updateProps({
                itemId: newEvent._id,
                itemType: 'event',
            });
            editor.setState({
                initialValues: {
                    _id: newEvent._id,
                    type: 'event',
                },
                diff: newEvent,
            });

            manager._save()
                .then(() => {
                    expect(main.save.callCount).toBe(1);
                    expect(main.save.args[0]).toEqual([
                        {},
                        {
                            ...newEvent,
                            update_method: EVENTS.UPDATE_METHODS[0],
                        },
                        true,
                    ]);

                    expect(editor.autoSave.remove.callCount).toBe(1);
                    expect(planningApi.unlock.callCount).toBe(0);
                    expect(manager.changeAction.callCount).toBe(1);
                    expect(manager.changeAction.args[0]).toEqual([
                        'edit',
                        newEvent,
                    ]);

                    done();
                })
                .catch(done.fail);
        });

        it('unlocks planning if creating event from it', (done) => {
            newEvent._planning_item = 'p1';
            item = newEvent;
            updateProps({
                itemId: newEvent._id,
                itemType: 'event',
            });
            editor.setState({
                initialValues: {
                    _id: newEvent._id,
                    type: 'event',
                },
                diff: newEvent,
            });

            manager._save()
                .then(() => {
                    expect(planningApi.unlock.callCount).toBe(1);
                    expect(planningApi.unlock.args[0]).toEqual([{
                        _id: 'p1',
                        type: 'planning',
                    }]);

                    done();
                })
                .catch(done.fail);
        });

        it('closes the editor aftering saving if closeAfter=true', (done) => {
            item = newEvent;
            updateProps({
                itemId: newEvent._id,
                itemType: 'event',
            });
            editor.setState({
                initialValues: {
                    _id: newEvent._id,
                    type: 'event',
                },
                diff: newEvent,
            });

            manager._save({closeAfter: true})
                .then(() => {
                    expect(manager.unlockAndCancel.callCount).toBe(1);
                    done();
                })
                .catch(done.fail);
        });

        it('saves an existing item', (done) => {
            item = {
                ...cloneDeep(testData.events[0]),
                slugline: 'updated event',
            };
            updateProps({
                itemId: item._id,
                itemType: item.type,
            });
            editor.setState({
                initialValues: testData.events[0],
                diff: item,
            });

            manager._save()
                .then(() => {
                    expect(main.save.callCount).toBe(1);
                    expect(main.save.args[0]).toEqual([
                        testData.events[0],
                        {
                            ...item,
                            update_method: EVENTS.UPDATE_METHODS[0],
                        },
                        true,
                    ]);

                    expectState({
                        initialValues: item,
                        diff: item,
                        dirty: false,
                        submitFailed: false,
                        ...states.notLoading,
                    });

                    expect(editor.autoSave.saveAutosave.callCount).toBe(1);
                    expect(editor.autoSave.saveAutosave.args[0][1]).toEqual(item);
                    expect(editor.autoSave.flushAutosave.callCount).toBe(2);

                    done();
                })
                .catch(done.fail);
        });

        it('sets submitting to false if main.save fails', (done) => {
            restoreSinonStub(main.save);
            sinon.stub(main, 'save').returns(Promise.reject());

            editor.setState({submitting: true});
            manager._save()
                .then(() => {
                    expectState({submitting: false});

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('post', () => {
        afterEach(() => {
            restoreSinonStub(main.post);
        });

        it('calls main.post with initialValues', (done) => {
            sinon.stub(main, 'post').returns(Promise.resolve({
                ...cloneDeep(testData.events[0]),
                _etag: 'e789',
            }));

            editor.setState({initialValues: testData.events[0]});
            manager.post()
                .then(() => {
                    expect(main.post.callCount).toBe(1);
                    expect(main.post.args[0]).toEqual([testData.events[0]]);
                    expectState({
                        initialValues: {
                            ...cloneDeep(testData.events[0]),
                            _etag: 'e789',
                        },
                    });

                    done();
                })
                .catch(done.fail);
        });

        it('sets submitting to false if main.post fails', (done) => {
            sinon.stub(main, 'post').returns(Promise.reject());
            editor.setState({submitting: true});
            manager.post()
                .then(() => {
                    expectState({submitting: false});

                    done();
                })
                .catch(done.fail);
        });

        it('post calls autoSave.save and then autoSave.flush', (done) => {
            sinon.stub(main, 'post').returns(Promise.resolve({
                ...cloneDeep(testData.events[0]),
                _etag: 'e789',
                state: 'scheduled',
                pubstatus: 'usable',
            }));

            editor.setState({initialValues: testData.events[0]});
            manager.post()
                .then(() => {
                    expect(editor.autoSave.saveAutosave.callCount).toBe(1);
                    expect(editor.autoSave.saveAutosave.args[0][1]).toEqual(
                        removeAutosaveFields({
                            ...cloneDeep(testData.events[0]),
                            _etag: 'e789',
                            state: 'scheduled',
                            pubstatus: 'usable',
                        })
                    );
                    expect(editor.autoSave.flushAutosave.callCount).toBe(2);

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('unpost', () => {
        afterEach(() => {
            restoreSinonStub(main.unpost);
        });

        it('calls main.unpost with initialValues', (done) => {
            sinon.stub(main, 'unpost').returns(Promise.resolve({
                ...cloneDeep(testData.events[0]),
                _etag: 'e789',
            }));

            editor.setState({initialValues: testData.events[0]});
            manager.unpost()
                .then(() => {
                    expect(main.unpost.callCount).toBe(1);
                    expect(main.unpost.args[0]).toEqual([testData.events[0]]);
                    expectState({
                        initialValues: {
                            ...cloneDeep(testData.events[0]),
                            _etag: 'e789',
                        },
                    });

                    done();
                })
                .catch(done.fail);
        });

        it('sets submitting to false if main.unpost fails', (done) => {
            sinon.stub(main, 'unpost').returns(Promise.reject());
            editor.setState({submitting: true});
            manager.unpost()
                .then(() => {
                    expectState({submitting: false});

                    done();
                })
                .catch(done.fail);
        });

        it('unpost calls autoSave.save and then autoSave.flush', (done) => {
            sinon.stub(main, 'unpost').returns(Promise.resolve({
                ...cloneDeep(testData.events[0]),
                _etag: 'e789',
                state: 'killed',
                pubstatus: 'cancelled',
            }));

            editor.setState({initialValues: testData.events[0]});
            manager.unpost()
                .then(() => {
                    expect(editor.autoSave.saveAutosave.callCount).toBe(1);
                    expect(editor.autoSave.saveAutosave.args[0][1]).toEqual(
                        removeAutosaveFields({
                            ...cloneDeep(testData.events[0]),
                            _etag: 'e789',
                            state: 'killed',
                            pubstatus: 'cancelled',
                        })
                    );
                    expect(editor.autoSave.flushAutosave.callCount).toBe(2);

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('save/saveAndPost/saveAndUnpost', () => {
        beforeEach(() => {
            sinon.stub(manager, '_save');
        });

        afterEach(() => {
            restoreSinonStub(manager._save);
        });

        it('save calls manager._save', () => {
            manager.save();
            expect(manager._save.callCount).toBe(1);
            expect(manager._save.args[0]).toEqual([{
                post: false,
                unpost: false,
                withConfirmation: true,
                updateMethod: EVENTS.UPDATE_METHODS[0],
                closeAfter: false,
                updateStates: true,
            }]);
        });

        it('saveAndPost calls manager._save', () => {
            manager.saveAndPost();
            expect(manager._save.callCount).toBe(1);
            expect(manager._save.args[0]).toEqual([{
                post: true,
                unpost: false,
                withConfirmation: true,
                updateMethod: EVENTS.UPDATE_METHODS[0],
                closeAfter: false,
                updateStates: true,
            }]);
        });

        it('saveAndUnpost calls manager._save', () => {
            manager.saveAndUnpost();
            expect(manager._save.callCount).toBe(1);
            expect(manager._save.args[0]).toEqual([{
                post: false,
                unpost: true,
                closeAfter: false,
            }]);
        });
    });

    describe('startPartialSave', () => {
        afterEach(() => {
            restoreSinonStub(manager.validate);
        });

        it('returns true if validation passes', () => {
            sinon.stub(manager, 'validate').callsFake((props, newState) => {
                newState.errorMessages = [];
            });

            expect(manager.startPartialSave(testData.events[0])).toBeTruthy();

            expect(manager.validate.callCount).toBe(1);
            expect(manager.validate.args[0][1]).toEqual(jasmine.objectContaining({
                diff: testData.events[0],
            }));

            expectState({submitFailed: false});
            expect(editor.props.notifyValidationErrors.callCount).toBe(0);
        });

        it('returns false if validation fails', () => {
            sinon.stub(manager, 'validate').callsFake((props, newState) => {
                newState.errorMessages = ['fails'];
            });

            expect(manager.startPartialSave(testData.events[0])).toBeFalsy();

            expect(manager.validate.callCount).toBe(1);
            expect(manager.validate.args[0][1]).toEqual(jasmine.objectContaining({
                diff: testData.events[0],
            }));

            expectState({submitFailed: true});
            expect(editor.props.notifyValidationErrors.callCount).toBe(1);
            expect(editor.props.notifyValidationErrors.args[0]).toEqual([
                ['fails'],
            ]);
        });
    });

    it('finalisePartialSave updates initialValues with partial diff', (done) => {
        const initialValues = cloneDeep(testData.plannings[0]);
        const diff = {
            ...cloneDeep(initialValues),
            slugline: 'Planning - Updated',
        };
        const partialDiff = {
            _etag: 'p789',
            assigned_to: {
                user: 'ident2',
                desk: 'desk1',
                assignment_id: 'as2',
                state: 'assigned',
            },
        };

        updateProps({
            itemId: initialValues._id,
            itemType: initialValues.type,
            itemAction: 'edit',
            initialValues: initialValues,
        });
        editor.setState({
            initialValues: initialValues,
            diff: diff,
        });

        manager.finalisePartialSave({
            _etag: partialDiff._etag,
            'coverages[1].assigned_to': partialDiff.assigned_to,
        })
            .then(() => {
                initialValues._etag = partialDiff._etag;
                initialValues.coverages[1] = {
                    ...initialValues.coverages[1],
                    assigned_to: partialDiff.assigned_to,
                };

                diff._etag = initialValues._etag;
                diff.coverages[1] = cloneDeep(initialValues.coverages[1]);

                expectState({
                    initialValues: initialValues,
                    diff: diff,
                    partialSave: false,
                    submitting: false,
                    submitFailed: false,
                });

                done();
            })
            .catch(done.fail);
    });

    describe('lock', () => {
        afterEach(() => {
            restoreSinonStub(locks.lock);
        });

        it('lock calls locks.lock', () => {
            sinon.stub(locks, 'lock');
            manager.lock(testData.events[0]);
            expect(locks.lock.callCount).toBe(1);
            expect(locks.lock.args[0]).toEqual([testData.events[0]]);
        });
    });

    describe('unlock', () => {
        beforeEach(() => {
            sinon.stub(locks, 'unlock');
            sinon.stub(locks, 'unlockThenLock');
            sinon.stub(eventsApi, 'unlock');
            sinon.stub(planningApi, 'unlock');
        });

        afterEach(() => {
            restoreSinonStub(locks.unlock);
            restoreSinonStub(locks.unlockThenLock);
            restoreSinonStub(eventsApi.unlock);
            restoreSinonStub(planningApi.unlock);
        });

        it('unlock on unknown item type calls locks.unlock', () => {
            updateProps({
                itemId: testData.events[0]._id,
                itemType: 'unknown',
            });
            manager.unlock();

            expect(eventsApi.unlock.callCount).toBe(0);
            expect(planningApi.unlock.callCount).toBe(0);
            expect(locks.unlock.callCount).toBe(1);
            expect(locks.unlock.args[0]).toEqual([{
                _id: testData.events[0]._id,
                type: 'unknown',
            }]);
        });

        it('unlock doesnt call any action on a temporary item', () => {
            // No id specified
            updateProps({itemType: newEvent.type});
            manager.unlock();
            expect(locks.unlock.callCount).toBe(0);
            expect(eventsApi.unlock.callCount).toBe(0);
            expect(planningApi.unlock.callCount).toBe(0);

            // Id is for a temporary item
            updateProps({itemId: newEvent._id});
            manager.unlock();
            expect(locks.unlock.callCount).toBe(0);
            expect(eventsApi.unlock.callCount).toBe(0);
            expect(planningApi.unlock.callCount).toBe(0);
        });

        it('unlock on Event calls events.api.unlock', () => {
            updateProps({
                itemId: testData.events[0]._id,
                itemType: testData.events[0].type,
            });
            manager.unlock();

            expect(locks.unlock.callCount).toBe(0);
            expect(planningApi.unlock.callCount).toBe(0);
            expect(eventsApi.unlock.callCount).toBe(1);
            expect(eventsApi.unlock.args[0]).toEqual([{
                _id: testData.events[0]._id,
                type: testData.events[0].type,
            }]);
        });

        it('unlock on Planning calls planning.api.unlock', () => {
            updateProps({
                itemId: testData.plannings[0]._id,
                itemType: testData.plannings[0].type,
            });
            manager.unlock();

            expect(locks.unlock.callCount).toBe(0);
            expect(eventsApi.unlock.callCount).toBe(0);
            expect(planningApi.unlock.callCount).toBe(1);
            expect(planningApi.unlock.args[0]).toEqual([{
                _id: testData.plannings[0]._id,
                type: testData.plannings[0].type,
            }]);
        });

        it('unlockThenLock calls locks.unlockThenLock', (done) => {
            manager.unlockThenLock(testData.events[0])
                .then(() => {
                    expect(locks.unlockThenLock.callCount).toBe(1);
                    expect(locks.unlockThenLock.args[0]).toEqual([testData.events[0], false]);

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('unlockAndCancel', () => {
        beforeEach(() => {
            sinon.stub(manager, 'unlock').returns(Promise.resolve());
            sinon.stub(planningApi, 'unlock').returns(Promise.resolve());
        });

        afterEach(() => {
            restoreSinonStub(manager.unlock);
            restoreSinonStub(planningApi.unlock);
        });

        it('doesnt call unlock if the item isnt locked', (done) => {
            editor.setState({
                initialValues: testData.events[0],
                diff: testData.events[0],
            });

            manager.unlockAndCancel()
                .then(() => {
                    expect(manager.unlock.callCount).toBe(0);

                    done();
                })
                .catch(done.fail);
        });

        it('unlocks, removes autosave and closes the editor', (done) => {
            const initialValues = {
                ...cloneDeep(testData.events[0]),
                lock_action: 'edit',
                lock_user: testData.sessions[0].identity._id,
                lock_session: testData.sessions[0].sessionId,
                lock_time: jasmine.any(moment),
            };

            editor.setState({
                initialValues: initialValues,
                diff: initialValues,
            });

            manager.unlockAndCancel()
                .then(() => {
                    expect(manager.unlock.callCount).toBe(1);
                    expect(planningApi.unlock.callCount).toBe(0);
                    expect(editor.autoSave.remove.callCount).toBe(1);
                    expect(editor.closeEditor.callCount).toBe(1);

                    done();
                })
                .catch(done.fail);
        });

        it('unlocks planning item if creating event from planning', (done) => {
            const initialValues = {
                ...cloneDeep(newEvent),
                _planning_item: 'p1',
            };

            editor.setState({
                initialValues: initialValues,
                diff: initialValues,
            });

            manager.unlockAndCancel()
                .then(() => {
                    expect(manager.unlock.callCount).toBe(0);
                    expect(planningApi.unlock.callCount).toBe(1);

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('changeAction', () => {
        beforeEach(() => {
            sinon.stub(main, 'openForEdit');
            sinon.stub(main, 'changeEditorAction');
        });

        afterEach(() => {
            restoreSinonStub(main.openForEdit);
            restoreSinonStub(main.changeEditorAction);
        });

        it('change the editor to a different item', (done) => {
            manager.changeAction('edit', testData.events[0])
                .then(() => {
                    expect(main.changeEditorAction.callCount).toBe(0);
                    expect(main.openForEdit.callCount).toBe(1);
                    expect(main.openForEdit.args[0]).toEqual([
                        testData.events[0],
                        true,
                        false,
                    ]);

                    done();
                })
                .catch(done.fail);
        });

        it('change the action for the same item', (done) => {
            manager.changeAction('read')
                .then(() => {
                    expect(main.openForEdit.callCount).toBe(0);
                    expect(main.changeEditorAction.callCount).toBe(1);
                    expect(main.changeEditorAction.args[0]).toEqual([
                        'read',
                        false,
                    ]);

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('addCoverageToWorkflow/removeAssignment', () => {
        beforeEach(() => {
            sinon.stub(manager, 'finalisePartialSave');
            sinon.stub(planningUi, 'addCoverageToWorkflow')
                .callsFake((planning, coverage, index) => {
                    const updates = {
                        ...cloneDeep(planning),
                        _etag: 'p456',
                        _updated: jasmine.any(moment),
                        version_creator: 'ident2',
                        versioncreated: jasmine.any(moment),
                    };

                    updates.coverages[index].assigned_to.assignment_id = 'as3';
                    updates.coverages[index].assigned_to.state = 'assigned';

                    return Promise.resolve(updates);
                });
            sinon.stub(planningUi, 'removeAssignment')
                .callsFake((planning, coverage, index) => {
                    const updates = {
                        ...cloneDeep(planning),
                        _etag: 'p789',
                        _updated: jasmine.any(moment),
                        version_creator: 'ident2',
                        versioncreated: jasmine.any(moment),
                    };

                    updates.coverages[index].assigned_to.assignment_id = null;
                    updates.coverages[index].assigned_to.state = null;

                    return Promise.resolve(updates);
                });
        });

        afterEach(() => {
            restoreSinonStub(manager.finalisePartialSave);
            restoreSinonStub(planningUi.addCoverageToWorkflow);
            restoreSinonStub(planningUi.removeAssignment);
        });

        it('addCoverageToWorkflow', (done) => {
            manager.addCoverageToWorkflow(
                testData.plannings[0],
                testData.plannings[0].coverages[1],
                1
            )
                .then(() => {
                    expect(planningUi.addCoverageToWorkflow.callCount).toBe(1);
                    expect(planningUi.addCoverageToWorkflow.args[0]).toEqual([
                        testData.plannings[0],
                        testData.plannings[0].coverages[1],
                        1,
                    ]);

                    expect(manager.finalisePartialSave.callCount).toBe(1);
                    expect(manager.finalisePartialSave.args[0]).toEqual([{
                        _etag: 'p456',
                        _updated: jasmine.any(moment),
                        version_creator: 'ident2',
                        versioncreated: jasmine.any(moment),
                        'coverages[1]': {
                            ...testData.plannings[0].coverages[1],
                            assigned_to: {
                                ...testData.plannings[0].coverages[1].assigned_to,
                                assignment_id: 'as3',
                                state: 'assigned',
                            },
                        },
                    }]);

                    done();
                })
                .catch(done.fail);
        });

        it('removeAssignment', (done) => {
            manager.removeAssignment(
                testData.plannings[0],
                testData.plannings[0].coverages[1],
                1
            )
                .then(() => {
                    expect(planningUi.removeAssignment.callCount).toBe(1);
                    expect(planningUi.removeAssignment.args[0]).toEqual([
                        testData.plannings[0],
                        testData.plannings[0].coverages[1],
                        1,
                    ]);

                    expect(manager.finalisePartialSave.callCount).toBe(1);
                    expect(manager.finalisePartialSave.args[0]).toEqual([{
                        _etag: 'p789',
                        _updated: jasmine.any(moment),
                        version_creator: 'ident2',
                        versioncreated: jasmine.any(moment),
                        'coverages[1]': {
                            ...testData.plannings[0].coverages[1],
                            assigned_to: {
                                ...testData.plannings[0].coverages[1].assigned_to,
                                assignment_id: null,
                                state: null,
                            },
                        },
                    }]);

                    done();
                })
                .catch(done.fail);
        });
    });
});
