import React from 'react'
import { shallow } from 'enzyme'
import { AgendaItem } from './index'
import sinon from 'sinon'

describe('agenda', () => {
    describe('components', () => {
        describe('<AgendaItem />', () => {
            let privileges
            let agenda
            const onEdit = sinon.spy()
            const deleteAgenda = sinon.spy()

            const getActiveWrapper = () => (
                shallow(<AgendaItem
                    agenda={agenda}
                    editAgenda={onEdit}
                    deleteAgenda={deleteAgenda}
                    privileges={privileges}/>
                )
            )

            beforeEach(() => {
                privileges = {
                    planning: 1,
                    planning_agenda_management: 1,
                }

                agenda = {
                    _id: 'a1',
                    name: 'Agenda 1',
                    is_enabled: true,
                    _created: '2017-05-12T06:00:00+0000',
                }

                onEdit.reset()
                deleteAgenda.reset()
            })

            it('renders an active agenda', () => {
                const wrapper = getActiveWrapper()

                expect(wrapper.find('.icon-pencil').length).toBe(1)

                const title = wrapper.find('[onClick]').first()
                const editButton = wrapper.find('.icon-pencil').parent()

                expect(title.text()).toContain(agenda.name)

                editButton.simulate('click')
                expect(onEdit.calledOnce).toBe(true)

                const deleteButton = wrapper.find('.icon-trash').parent()
                deleteButton.simulate('click')
                expect(deleteAgenda.calledOnce).toBe(true)
            })

            it('shows `edit` button with privilege', () => {
                let wrapper = getActiveWrapper()
                expect(wrapper.find('.icon-pencil').length).toBe(1)

                privileges.planning_agenda_management = 0
                wrapper = getActiveWrapper()
                expect(wrapper.find('.icon-pencil').length).toBe(0)
                expect(wrapper.find('.icon-trash').length).toBe(0)
            })
        })
    })
})
