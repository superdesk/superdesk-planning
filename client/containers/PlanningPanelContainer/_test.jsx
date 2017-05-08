import { createTestStore } from '../../utils'
import * as actions from '../../actions'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import React from 'react'
import { PlanningItem } from '../../components'
import { PlanningPanelContainer } from '../index'

describe('<PlanningPanelContainer />', () => {
    const initialState = {
        planning: {
            plannings: {
                planning1: { _id: 'planning1' },
                planning2: { _id: 'planning2' },
                planning3: { _id: 'planning3' },
            },
        },
        agenda: {
            agendas: [{
                _id: 'agenda1',
                planning_items: ['planning1', 'planning2'],
            }],
            currentAgendaId: 'agenda1',
        },
    }
    it('addEventToCurrentAgenda', () => {
        const initialState = {
            planning: { plannings: {} },
            agenda:
            {
                agendas: [{
                    _id: '1',
                    name: 'agenda',
                }],
                currentAgendaId: '1',
            },
        }
        const EVENT = {
            _id: '2',
            name: 'event',
        }
        const store = createTestStore({
            extraArguments: { apiQuery: () => ({ _items: [EVENT] }) },
            initialState,
        })
        store.dispatch(actions.addEventToCurrentAgenda(EVENT)).then(() => {
            expect(store.getState().planning.plannings).toEqual({ 2: EVENT })
        })
    })
    it('Create a planning in the current agenda', (done) => {
        const initialState = {
            planning: { plannings: {} },
            agenda: {
                agendas: [{
                    _id: 'agenda1',
                    name: 'agenda',
                    planning_type: 'agenda',
                }],
                currentAgendaId: 'agenda1',
            },
        }
        const store = createTestStore({
            extraArguments: {
                // Mock what the api will return when the planning list will be refreshed
                apiQuery: () => ({
                    _items: [{
                        _id: 'RefreshedplanningId',
                        slugline: 'coucou',
                    }],
                }),
            },
            initialState,
        })
        expect(store.getState().planning.currentPlanningId).toBe(undefined)
        store.dispatch(actions.savePlanningAndReloadCurrentAgenda({ slugline: 'coucou' }))
        .then((planningCreated) => {
            // the planning has been added to the current agenda
            expect(store.getState().agenda.agendas[0].planning_items[0])
                .toEqual(planningCreated._id)
            // open the planning
            store.dispatch(actions.openPlanningEditor(planningCreated._id))
            // the planning editor has been opened with the saved planning
            expect(store.getState().planning.editorOpened).toBe(true)
            expect(store.getState().planning.currentPlanningId).toEqual(planningCreated._id)
            // the planning list has been refreshed
            expect(store.getState().planning.plannings.RefreshedplanningId)
                .toEqual({
                    _id: 'RefreshedplanningId',
                    slugline: 'coucou',
                })
            done()
        })
    })
    it('loads plannings when agenda is selected', () => {
        const initialState = {
            planning: {
                plannings: {
                    planning1: { _id: 'planning1' },
                    planning2: { _id: 'planning2' },
                    planning3: { _id: 'planning3' },
                },
            },
            agenda: {
                agendas: [{
                    _id: 'agenda1',
                    planning_items: ['planning1', 'planning2'],
                }],
            },
        }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <PlanningPanelContainer />
            </Provider>
        )
        expect(wrapper.find(PlanningItem).length).toBe(0)
        store.dispatch(actions.selectAgenda('agenda1'))
        expect(wrapper.find(PlanningItem).length)
        .toBe(initialState.agenda.agendas[0].planning_items.length)
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
    it('delete a planning', (done) => {
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <PlanningPanelContainer />
            </Provider>
        )
        expect(Object.keys(store.getState().planning.plannings)).toContain('planning1')
        expect(store.getState().modal.modalType).toBe(null)
        wrapper.find('PlanningPanel').props().handlePlanningDeletion({ _id: 'planning1' })
        expect(store.getState().modal.modalType).toBe('CONFIRMATION')
        store.getState().modal.modalProps.action()
        .then(() => {
            expect(Object.keys(store.getState().planning.plannings)).not.toContain('planning1')
            done()
        })
    })
})
