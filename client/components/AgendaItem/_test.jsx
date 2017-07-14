import React from 'react'
import { shallow } from 'enzyme'
import { AgendaItem } from './index'
import sinon from 'sinon'

describe('agenda', () => {
    describe('components', () => {
        describe('<AgendaItem />', () => {
            let privileges
            let agenda
            const onClick = sinon.spy()
            const onEdit = sinon.spy()

            const getActiveWrapper = () => (
                shallow(<AgendaItem
                    agenda={agenda}
                    onClick={onClick}
                    editEvent={onEdit}
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
                    _created: '2017-05-12T06:00:00+0000',
                }

                onClick.reset()
                onEdit.reset()
            })

            it('renders an active agenda', () => {
                const wrapper = getActiveWrapper()

                expect(wrapper.find('.icon-pencil').length).toBe(1)

                const title = wrapper.find('[onClick]').first()
                const editButton = wrapper.find('.icon-pencil').parent()

                expect(title.text()).toContain(agenda.name)

                title.simulate('click')
                expect(onClick.calledOnce).toBe(true)

                editButton.simulate('click')
                expect(onEdit.calledOnce).toBe(true)
            })

            it('shows `edit` button with privilege', () => {
                let wrapper = getActiveWrapper()
                expect(wrapper.find('.icon-pencil').length).toBe(1)

                privileges.planning_agenda_management = 0
                wrapper = getActiveWrapper()
                expect(wrapper.find('.icon-pencil').length).toBe(0)
            })
        })
    })
})
