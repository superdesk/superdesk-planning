import React from 'react'
import { shallow } from 'enzyme'
import { SelectAgendaComponent } from '../SelectAgenda'
import sinon from 'sinon'
import * as actions from '../../actions'
import * as selectors from '../../selectors'
import { createStore } from '../../utils'

describe('<SelectAgendaComponent />', () => {
    const agendas = [
        { _id: '1', name: 'agenda1' },
        { _id: '2', name: 'agenda2' },
    ]
    it('selects an agenda', () => {
        const handleOnChange = sinon.spy()
        const wrapper = shallow(
            <SelectAgendaComponent
                agendas={agendas}
                currentAgenda="1"
                onChange={handleOnChange} />
        )
        expect(wrapper.find('select').props().value).toBe('1')
        wrapper.simulate('change', { target: { value: '2' } })
        expect(handleOnChange.calledOnce).toBe(true)
        expect(wrapper.find('option').length).toBe(3)
    })
    it('fetch selected agenda plannings', (done) => {
        const initialState = {
            planning: {
                plannings: {
                    3: { _id: '3', slugline: 'planning 3' }
                },
                agendas: [
                    { _id: '1', name: 'agenda1' },
                    { _id: '2', name: 'agenda2', planning_items: ['3'] },
                ],
                currentAgendaId: '1',
            }
        }
        const store = createStore({
            initialState: initialState,
            testMode: true
        })
        // must be empty first
        expect(selectors.getCurrentAgendaPlannings(store.getState()))
        .toEqual([])
        store.dispatch(actions.selectAgenda('2')).then(() => {
            // check if selection is registered in the store
            expect(store.getState().planning.currentAgendaId)
            .toEqual('2')
            // must be not empty any more
            expect(selectors.getCurrentAgendaPlannings(store.getState()))
            .toEqual([initialState.planning.plannings['3']])
            done()
        })
    })

})
