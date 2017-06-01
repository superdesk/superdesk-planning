import React from 'react'
import { shallow, mount } from 'enzyme'
import { SelectAgendaComponent, SelectAgenda } from './index'
import sinon from 'sinon'
import { Provider } from 'react-redux'
import * as actions from '../../actions'
import * as selectors from '../../selectors'
import { createTestStore } from '../../utils'

describe('<SelectAgendaComponent />', () => {
    const agendas = [
        {
            _id: '1',
            name: 'agenda1',
        },
        {
            _id: '2',
            name: 'agenda2',
            state: 'active',
        },
        {
            _id: '3',
            name: 'agenda3',
            state: 'spiked',
        },
    ]
    it('selects an agenda', () => {
        const handleOnChange = sinon.spy()
        const wrapper = shallow(
            <SelectAgendaComponent
                activeAgendas={agendas.filter((a) => a.state !== 'spiked')}
                spikedAgendas={agendas.filter((a) => a.state === 'spiked')}
                currentAgenda="1"
                onChange={handleOnChange} />
        )
        expect(wrapper.find('select').props().value).toBe('1')
        wrapper.simulate('change', { target: { value: '2' } })
        expect(handleOnChange.calledOnce).toBe(true)

        // One option for `Select an agenda` and another
        // option for the divider
        expect(wrapper.find('option').length).toBe(5)
    })
    it('selects an agenda within container', () => {
        const store = createTestStore()
        const wrapper = mount(
            <Provider store={store}>
                <SelectAgenda/>
            </Provider>
        )
        wrapper.simulate('change', { target: { value: 'newAgenda' } })
        expect(store.getState().agenda.currentAgendaId).toBe('newAgenda')
    })
    it('fetch selected agenda plannings', (done) => {
        const initialState = {
            planning: {
                plannings: {
                    '3': {
                        _id: '3',
                        slugline: 'planning 3',
                    },
                },
            },
            agenda: {
                agendas: [
                    {
                        _id: '1',
                        name: 'agenda1',
                    },
                    {
                        _id: '2',
                        name: 'agenda2',
                        planning_items: ['3'],
                    },
                ],
                currentAgendaId: '1',
            },
        }
        const store = createTestStore({ initialState: initialState })
        // must be empty first
        expect(selectors.getCurrentAgendaPlannings(store.getState()))
        .toEqual([])
        store.dispatch(actions.selectAgenda('2')).then(() => {
            // check if selection is registered in the store
            expect(store.getState().agenda.currentAgendaId)
            .toEqual('2')
            // expect(selectors.getCurrentAgenda(store.getState())._id).toEqual('2')
            // must be not empty any more
            expect(selectors.getCurrentAgendaPlannings(store.getState()))
            .toEqual([initialState.planning.plannings['3']])
            done()
        })
    })

})
