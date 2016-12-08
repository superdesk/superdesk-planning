import React from 'react'
import { shallow } from 'enzyme'
import { SelectAgendaComponent } from '../SelectAgenda'
import sinon from 'sinon'

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

})
