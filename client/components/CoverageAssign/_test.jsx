import React from 'react'
import { mount } from 'enzyme'
import { CoverageAssign } from './index'

const desks = [{
    _id: 123,
    name: 'Politic Desk',
},
{
    _id: 234,
    name: 'Sports Desk',
}]

const users = [{
    _id: 345,
    display_name: 'firstname lastname',
},
{
    _id: 456,
    display_name: 'firstname2 lastname2',
}]

class TestForm extends React.Component {
    render() {
        const i = this.props.input ? this.props.input : {}
        return (
            <CoverageAssign
                input={i}
                users={this.props.users}
                desks={this.props.desks} />
        )
    }
}

TestForm.propTypes = {
    users: React.PropTypes.array.isRequired,
    desks: React.PropTypes.array.isRequired,
    input: React.PropTypes.object,
}

describe('<CoverAssign />', () => {
    it('Opens assignment popup', () => {
        const wrapper = mount(<TestForm users={users}
                desks={desks} />)

        wrapper.find('.coverageassign__action').at(1).simulate('click')
        expect(wrapper.find('.coverageassignselect').length).toBe(1)
    })
    it('Desks and users are populated', () => {
        const wrapper = mount(<TestForm users={users}
                desks={desks} />)

        wrapper.find('.coverageassign__action').at(1).simulate('click')
        const lst = wrapper.find('ul')
        expect(lst.children().length).toBe(4)
        const lbls = lst.at(0).find('.coverageassignselect__label')
        expect(lbls.get(0).textContent).toBe('Politic Desk')
        expect(lbls.get(1).textContent).toBe('Sports Desk')
        expect(lbls.get(2).textContent).toBe('firstname lastname')
        expect(lbls.get(3).textContent).toBe('firstname2 lastname2')
    })
    it('Shows desk assignment correctly with right avatar', () => {
        const input = { value: { desk: 123 } }
        const wrapper = mount(<TestForm users={users}
                desks={desks}
                input={input} />)
        const deskLbl = wrapper.find('label').get(0)
        expect(deskLbl.textContent).toBe('Desk: Politic Desk')
        expect(wrapper.find('.desk').length).toBe(1)
    })
    it('Shows user assignment correctly with right avatar', () => {
        const input = { value: { user: 456 } }
        const wrapper = mount(<TestForm users={users}
                desks={desks}
                input={input} />)
        const avatarLbl = wrapper.find('span')
        expect(avatarLbl.get(0).textContent).toBe('FL')
        const userLbl = wrapper.find('label').get(0)
        expect(userLbl.textContent).toBe('firstname2 lastname2')
        expect(wrapper.find('.initials').length).toBe(1)
    })
})
