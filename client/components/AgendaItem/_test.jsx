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
            const onSpike = sinon.spy()

            const getActiveWrapper = () => (
                shallow(<AgendaItem
                    agenda={agenda}
                    onClick={onClick}
                    editEvent={onEdit}
                    spikeEvent={onSpike}
                    privileges={privileges}/>
                )
            )

            const getSpikedWrapper = () => (
                shallow(<AgendaItem
                    agenda={agenda}
                    onClick={onClick}
                    spikeEvent={onSpike}
                    privileges={privileges}/>
                )
            )

            beforeEach(() => {
                privileges = {
                    planning: 1,
                    planning_agenda_management: 1,
                    planning_agenda_spike: 1,
                    planning_agenda_unspike: 1,
                }

                agenda = {
                    _id: 'a1',
                    name: 'Agenda 1',
                    planning_items: [],
                    _created: '2017-05-12T06:00:00+0000',
                }

                onClick.reset()
                onEdit.reset()
                onSpike.reset()
            })

            it('renders an active agenda', () => {
                const wrapper = getActiveWrapper()

                expect(wrapper.find('h6').length).toBe(1)
                expect(wrapper.find('.icon-pencil').length).toBe(1)
                expect(wrapper.find('.icon-trash').length).toBe(1)
                expect(wrapper.find('.icon-unspike').length).toBe(0)

                const title = wrapper.find('h6')
                const editButton = wrapper.find('.icon-pencil').parent()
                const spikeButton = wrapper.find('.icon-trash').parent()

                expect(title.text()).toBe(agenda.name)

                title.simulate('click')
                expect(onClick.calledOnce).toBe(true)

                editButton.simulate('click')
                expect(onEdit.calledOnce).toBe(true)

                spikeButton.simulate('click')
                expect(onSpike.calledOnce).toBe(true)
            })

            it('renders a spiked agenda', () => {
                agenda.state = 'spiked'
                const wrapper = getSpikedWrapper()

                expect(wrapper.find('h6').length).toBe(1)
                expect(wrapper.find('.icon-pencil').length).toBe(0)
                expect(wrapper.find('.icon-trash').length).toBe(0)
                expect(wrapper.find('.icon-unspike').length).toBe(1)

                const unspikeButton = wrapper.find('.icon-unspike').parent()

                unspikeButton.simulate('click')
                expect(onSpike.calledOnce).toBe(true)
            })

            it('shows `edit` button with privilege', () => {
                let wrapper = getActiveWrapper()
                expect(wrapper.find('.icon-pencil').length).toBe(1)

                privileges.planning_agenda_management = 0
                wrapper = getActiveWrapper()
                expect(wrapper.find('.icon-pencil').length).toBe(0)
            })

            it('shows `spike` button with privilege', () => {
                let wrapper = getActiveWrapper()
                expect(wrapper.find('.icon-trash').length).toBe(1)

                privileges.planning_agenda_spike = 0
                wrapper = getActiveWrapper()
                expect(wrapper.find('.icon-trash').length).toBe(0)
            })

            it('shows `unspike` button with privilege', () => {
                agenda.state = 'spiked'
                let wrapper = getSpikedWrapper()
                expect(wrapper.find('.icon-unspike').length).toBe(1)

                privileges.planning_agenda_unspike = 0
                wrapper = getSpikedWrapper()
                expect(wrapper.find('.icon-unspike').length).toBe(0)
            })
        })
    })
})
