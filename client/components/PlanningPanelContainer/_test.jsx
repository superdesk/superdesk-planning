import { createTestStore } from '../../utils'
import * as actions from '../../actions'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import React from 'react'
import { PlanningItem } from '../../components'
import { PlanningPanelContainer } from '../index'
import { AutoSizer } from 'react-virtualized'

describe('planning', () => {
    // Give the space to Autosizer to display the list
    beforeEach(() => (
        spyOn(AutoSizer.prototype, 'render').and.callFake(function render() {
            return (
                <div ref={this._setRef}>
                    {this.props.children({
                        width: 200,
                        height: 400,
                    })}
                </div>
            )
        })
    ))

    describe('containers', () => {

        describe('<PlanningPanelContainer />', () => {
            const initialState = {
                events: {
                    events: {
                        event1: {
                            _id: 'event1',
                            name: 'event name',
                        },
                    },
                },
                planning: {
                    plannings: {
                        planning1: {
                            _id: 'planning1',
                            agendas: ['agenda1'],
                        },
                        planning2: {
                            _id: 'planning2',
                            event_item: ['event1'],
                            headline: 'headline',
                            agendas: ['agenda1'],
                            coverages: [{
                                planning: {
                                    scheduled: '2016-10-15T13:01:11+0000',
                                    g2_content_type: 'photo',
                                },
                            }],
                        },
                        planning3: {
                            _id: 'planning3',
                            agendas: [],
                        },
                    },
                },
                agenda: {
                    agendas: [{
                        _id: 'agenda1',
                        name: 'agenda',
                        is_enabled: true,
                    }],
                    currentAgendaId: 'agenda1',
                },
                privileges: {
                    planning: 1,
                    planning_planning_management: 1,
                },
                session: { identity: { _id: 'user' } },
            }

            it('addEventToCurrentAgenda', () => {
                const initialState = {
                    planning: { plannings: {} },
                    agenda:
                    {
                        agendas: [{
                            _id: '1',
                            name: 'agenda',
                            is_enabled: true,
                        }],
                        currentAgendaId: '1',
                    },
                    privileges: {
                        planning: 1,
                        planning_planning_management: 1,
                    },
                }
                const EVENT = {
                    _id: '2',
                    name: 'event',
                }
                const store = createTestStore({
                    extraArguments: {
                        apiQuery: () => (
                            {
                                _items: [
                                    {
                                        _id: '2',
                                        name: 'event',
                                        agendas: ['agenda1'],
                                    },
                                ],
                            }
                        ),
                    },
                    initialState,
                })
                store.dispatch(actions.addEventToCurrentAgenda(EVENT)).then(() => {
                    expect(store.getState().planning.plannings).toEqual({
                        2: {
                            _id: '2',
                            name: 'event',
                            agendas: ['agenda1'],
                            coverages: [],
                        },
                    })
                })
            })

            it('Create a planning in the current agenda', (done) => {
                const initialState = {
                    planning: { plannings: {} },
                    agenda: {
                        agendas: [{
                            _id: 'agenda1',
                            name: 'agenda',
                            is_enabled: true,
                        }],
                        currentAgendaId: 'agenda1',
                    },
                    privileges: {
                        planning: 1,
                        planning_planning_management: 1,
                    },
                }
                const store = createTestStore({
                    extraArguments: {
                        // Mock what the api will return when the planning list will be refreshed
                        apiQuery: () => ({
                            _items: [{
                                _id: 'RefreshedplanningId',
                                slugline: 'coucou',
                                agendas: ['agenda1'],
                            }],
                        }),
                        apiGetById: () => ({
                            _id: 'RefreshedplanningId',
                            slugline: 'coucou',
                            agendas: ['agenda1'],
                        }),
                    },
                    initialState,
                })



                expect(store.getState().planning.currentPlanningId).toBe(undefined)
                store.dispatch(actions.planning.ui.saveAndReloadCurrentAgenda({ slugline: 'coucou' }))
                .then((planningCreated) => {
                    // the planning has been added to the current agenda
                    expect(store.getState().planning.plannings['RefreshedplanningId'].agendas[0])
                        .toEqual(initialState.agenda.agendas[0]._id)
                    // open the planning
                    return store.dispatch(actions.planning.ui.openEditor(planningCreated._id))
                    .then(() => {
                        // the planning editor has been opened with the saved planning
                        expect(store.getState().planning.editorOpened).toBe(true)
                        expect(store.getState().planning.currentPlanningId).toEqual(planningCreated._id)
                        // the planning list has been refreshed
                        expect(store.getState().planning.plannings.RefreshedplanningId)
                            .toEqual({
                                _id: 'RefreshedplanningId',
                                slugline: 'coucou',
                                coverages: [],
                                agendas: ['agenda1'],
                            })
                        done()
                    })
                })
            })

            it('loads plannings when agenda is selected', (done) => {
                const initialState = {
                    planning: {
                        plannings: {
                            planning1: {
                                _id: 'planning1',
                                'agendas': ['agenda1'],
                            },
                            planning2: {
                                _id: 'planning2',
                                'agendas': ['agenda1'],
                            },
                            planning3: {
                                _id: 'planning3',
                                'agendas': [],
                            },
                        },
                        planningsInList: [],
                    },
                    agenda: {
                        agendas: [{
                            _id: 'agenda1',
                            name: 'agenda',
                            is_enabled: true,
                        }],
                        currentAgendaId: null,
                        currentAgenda: null,
                    },
                    privileges: {
                        planning: 1,
                        planning_planning_management: 1,
                    },
                    session: { identity: { _id: 'user' } },
                }

                const store = createTestStore({
                    initialState,
                    extraArguments: {
                        apiQuery: () => ({
                            _items: [
                                initialState.planning.plannings.planning1,
                                initialState.planning.plannings.planning2,
                            ],
                        }),
                    },
                })

                const wrapper = mount(
                    <Provider store={store}>
                        <PlanningPanelContainer />
                    </Provider>
                )

                expect(wrapper.find(PlanningItem).length).toBe(0)
                store.dispatch(actions.selectAgenda('agenda1'))
                .then(() => {
                    expect(wrapper.find(PlanningItem).length)
                    .toBe(2)

                    done()
                })
            })

            it('drag and drop', () => {
                const store = createTestStore({ initialState })
                const wrapper = mount(
                    <Provider store={store}>
                        <PlanningPanelContainer />
                    </Provider>
                )
                const jsEvent = { dataTransfer: { getData: () => ('{}') } }
                wrapper.find('.Planning-panel')
                .simulate('drop', jsEvent)
                .simulate('dragLeave')
                .simulate('dragOver')
                .simulate('dragEnter', jsEvent)
            })

            it('spike a planning', (done) => {
                const store = createTestStore({
                    initialState,
                    extraArguments: {
                        apiQuery: () => ({
                            _items: [
                                initialState.planning.plannings.planning1,
                                initialState.planning.plannings.planning2,
                            ],
                        }),
                    },
                })

                const item = {
                    _id: 'planning1',
                    headline: 'Plan1',
                    slugline: 'Plan1',
                    agendas: ['agenda1'],
                }

                const wrapper = mount(
                    <Provider store={store}>
                        <PlanningPanelContainer />
                    </Provider>
                )

                store.dispatch(actions.selectAgenda('agenda1'))
                .then(() => {
                    wrapper.find('PlanningList').props().handlePlanningSpike(item)
                    expect(store.getState().modal.modalType).toBe('CONFIRMATION')
                    expect(store.getState().modal.modalProps.body).toBe(
                        'Are you sure you want to spike the planning item Plan1 ?'
                    )

                    done()
                })
            })

            it('unspike a planning', (done) => {
                const store = createTestStore({
                    initialState,
                    extraArguments: {
                        apiQuery: () => ({
                            _items: [
                                initialState.planning.plannings.planning1,
                                initialState.planning.plannings.planning2,
                            ],
                        }),
                    },
                })

                const item = {
                    _id: 'planning1',
                    headline: 'Plan1',
                    slugline: 'Plan1',
                    agendas: ['agenda1'],
                }

                const wrapper = mount(
                    <Provider store={store}>
                        <PlanningPanelContainer />
                    </Provider>
                )

                store.dispatch(actions.selectAgenda('agenda1'))
                .then(() => {
                    wrapper.find('PlanningList').props().handlePlanningUnspike(item)
                    expect(store.getState().modal.modalType).toBe('CONFIRMATION')
                    expect(store.getState().modal.modalProps.body).toBe(
                        'Are you sure you want to unspike the planning item Plan1 ?'
                    )

                    done()
                })
            })
        })
    })
})
