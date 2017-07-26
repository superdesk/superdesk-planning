import React from 'react'
import { mount } from 'enzyme'
import { AgendaList } from './index'
import sinon from 'sinon'


describe('AgendaList', () => {
    describe('components', () => {
        describe('<AgendaList />', () => {
            let privileges, agendas
            const openEditAgenda = sinon.spy()

            const getMountedWrapper = () => (
                mount(<AgendaList
                    agendas={agendas}
                    openEditAgenda={openEditAgenda}
                    privileges={privileges}/>
                )
            )

            beforeEach(() => {
                privileges = {
                    planning: 1,
                    planning_agenda_management: 1,
                }

                agendas = [
                    {
                        _id: 'a1',
                        name: 'Agenda 1',
                        is_enabled: true,
                        _created: '2017-05-12T06:00:00+0000',
                    },
                    {
                        _id: 'a2',
                        name: 'Agenda 2',
                        is_enabled: true,
                        _created: '2017-05-12T06:00:00+0000',
                    },
                ]

                openEditAgenda.reset()
            })

            it('show agendas', () => {
                const wrapper = getMountedWrapper()
                expect(wrapper.find('.sd-list-item').length).toBe(2)
            })

            it('if privileges are enabled', () => {
                const wrapper = getMountedWrapper()
                expect(wrapper.find('.icon-pencil').length).toBe(2)
                const editAgenda = wrapper.find('.icon-pencil').first().parent()
                editAgenda.simulate('click')
                expect(openEditAgenda.callCount).toBe(1)
            })

            it('if privileges are disabled', () => {
                privileges.planning_agenda_management = 0
                const wrapper = getMountedWrapper()
                expect(wrapper.find('.icon-pencil').length).toBe(0)
            })
        })
    })
})
