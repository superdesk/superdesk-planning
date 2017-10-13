import React from 'react'
import { mount } from 'enzyme'
import { EditAssignment } from './index'

const desks = [{
    _id: 123,
    name: 'Politic Desk',
    members: [
        { user: 345 },
    ],
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
},
]

class TestForm extends React.Component {
    render() {
        const i = this.props.input ? this.props.input : {}
        const coverageProvider = [{
            qcode: 'ProviderQcode_1',
            name: 'Provider',
        }]

        return (
            <EditAssignment
                input={i}
                users={this.props.users}
                desks={this.props.desks}
                coverageProviders={coverageProvider}
                context="coverage"/>
        )
    }
}

TestForm.propTypes = {
    users: React.PropTypes.array.isRequired,
    desks: React.PropTypes.array.isRequired,
    input: React.PropTypes.object,
}

describe('<EditAssignment />', () => {

    it('Opens assignment popup', () => {
        const wrapper = mount(<TestForm users={users}
                desks={desks} />)
        wrapper.find('.assignment__action').simulate('click')
        expect(wrapper.find('.assignmentselect').length).toBe(1)
    })

    it('Users are populated', () => {
        const wrapper = mount(<TestForm users={users}
                desks={desks} />)

        wrapper.find('.assignment__action').simulate('click')
        const lst = wrapper.find('ul')
        expect(lst.children().length).toBe(2)
        const lbls = lst.at(0).find('.assignmentselect__label')
        expect(lbls.get(0).textContent).toBe('firstname lastname')
        expect(lbls.get(1).textContent).toBe('firstname2 lastname2')
    })

    it('Desks are populated', () => {
        const wrapper = mount(<TestForm users={users}
                desks={desks} />)
        wrapper.find('.assignment__action').simulate('click')
        const deskSelectFieldComponent = wrapper.find('DeskSelectField')
        expect(deskSelectFieldComponent.props().desks.length).toBe(2)
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk')
        expect(deskSelectFieldComponent.props().desks[1].name).toBe('Sports Desk')
    })


    it('Coverage Providers are populated', () => {
        const wrapper = mount(<TestForm users={users}
                desks={desks} />)
        wrapper.find('.assignment__action').simulate('click')
        const providerList = wrapper.find('select').at(1)
        expect(providerList.children().length).toBe(2)
        expect(providerList.children().at(1).props().value).toBe('ProviderQcode_1')
    })

    it('Selected desk populates only those users who belong that desk and coverage providers', () => {
        const input = { value: { desk: 123 } }
        const wrapper = mount(<TestForm users={users}
                desks={desks} input={input} />)
        wrapper.find('.assignment__action').simulate('click')
        const lst = wrapper.find('ul')
        expect(lst.children().length).toBe(1)
        const lbls = lst.at(0).find('.assignmentselect__label')
        expect(lbls.get(0).textContent).toBe('firstname lastname')

        const providerList = wrapper.find('select').at(1)
        expect(providerList.children().length).toBe(2)
        expect(providerList.children().at(1).props().value).toBe('ProviderQcode_1')
    })

    it('Selecting a user populates only that user desk', () => {
        const wrapper = mount(<TestForm users={users}
                desks={desks} />)
        wrapper.find('.assignment__action').simulate('click')

        const deskSelectFieldComponent = wrapper.find('DeskSelectField')
        expect(deskSelectFieldComponent.props().desks.length).toBe(2)
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk')
        expect(deskSelectFieldComponent.props().desks[1].name).toBe('Sports Desk')

        const lst = wrapper.find('ul')
        lst.children().first().find('button').simulate('click')

        expect(deskSelectFieldComponent.props().desks.length).toBe(1)
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk')
    })

    it('Cannot save until a desk is selected', () => {
        const wrapper = mount(<TestForm users={users}
                desks={desks} />)
        wrapper.find('.assignment__action').simulate('click')

        const lst = wrapper.find('ul')
        lst.children().first().find('button').simulate('click')

        expect(wrapper.find('.btn--primary').length).toBe(0)
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

    it('Coverage provider is populated for all desks', () => {
        // Select desk: 123
        let input = { value: { desk: 123 } }
        const wrapper = mount(<TestForm users={users}
                desks={desks} input={input} />)
        wrapper.find('.assignment__action').simulate('click')
        const providerList1 = wrapper.find('select').at(1)
        expect(providerList1.children().length).toBe(2)
        expect(providerList1.children().at(1).props().value).toBe('ProviderQcode_1')

        // Select desk: 234
        input = { value: { desk: 234 } }
        const wrapper2 = mount(<TestForm users={users}
                desks={desks} input={input} />)
        wrapper2.find('.assignment__action').simulate('click')
        const providerList2 = wrapper.find('select').at(1)
        expect(providerList2.children().length).toBe(2)
        expect(providerList2.children().at(1).props().value).toBe('ProviderQcode_1')
    })

    it('Selecting a coverage provider displays all desks', () => {
        const wrapper = mount(<TestForm users={users}
                desks={desks} />)
        wrapper.find('.assignment__action').simulate('click')

        const deskSelectFieldComponent = wrapper.find('DeskSelectField')
        expect(deskSelectFieldComponent.props().desks.length).toBe(2)
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk')
        expect(deskSelectFieldComponent.props().desks[1].name).toBe('Sports Desk')

        const providerList = wrapper.find('select').at(1)
        expect(providerList.children().length).toBe(2)
        expect(providerList.children().at(1).props().value).toBe('ProviderQcode_1')
        providerList.children().at(1).simulate('click')

        expect(deskSelectFieldComponent.props().desks.length).toBe(2)
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk')
        expect(deskSelectFieldComponent.props().desks[1].name).toBe('Sports Desk')
    })
})
