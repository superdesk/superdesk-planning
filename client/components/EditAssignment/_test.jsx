import moment from 'moment';
import React from 'react';
import {Provider} from 'react-redux';
import {mount} from 'enzyme';
import {createTestStore} from '../../utils';
import {EditAssignment} from './index';

const desks = [{
    _id: 123,
    name: 'Politic Desk',
    members: [
        {user: 345},
    ],
},
{
    _id: 234,
    name: 'Sports Desk',
}];

const users = [{
    _id: 345,
    display_name: 'firstname lastname',
},
{
    _id: 456,
    display_name: 'firstname2 lastname2',
},
];

class TestForm extends React.Component {
    render() {
        const i = this.props.input ? this.props.input : {value: ''};
        const coverageProvider = [{
            qcode: 'ProviderQcode_1',
            name: 'Provider',
        }];

        const context = this.props.context || 'coverage';

        return (
            <EditAssignment
                input={i}
                users={this.props.users}
                desks={this.props.desks}
                deskSelectionDisabled={this.props.deskSelectionDisabled}
                coverageProviders={coverageProvider}
                context={context}/>
        );
    }
}

TestForm.propTypes = {
    users: React.PropTypes.array.isRequired,
    desks: React.PropTypes.array.isRequired,
    input: React.PropTypes.object,
    deskSelectionDisabled: React.PropTypes.bool,
    context: React.PropTypes.string,
};

const store = createTestStore();

const getWrapper = () => (
    mount(<Provider store={store}>
        <TestForm users={users} desks={desks} />
    </Provider>)
);


const getWrapperWithInput = (input) => (
    mount(<Provider store={store}>
        <TestForm users={users} desks={desks} input={input}/>
    </Provider>)
);

describe('<EditAssignment />', () => {
    it('Opens assignment popup', () => {
        const wrapper = getWrapper();

        wrapper.find('.assignment__action').simulate('click');
        expect(wrapper.find('.assignmentselect').length).toBe(1);
    });

    it('Users are populated', () => {
        const wrapper = getWrapper();

        wrapper.find('.assignment__action').simulate('click');
        wrapper.find('input').first()
            .simulate('click');
        const lst = wrapper.find('ul');

        expect(lst.children().length).toBe(2);
        const lbls = lst.at(0).find('.assignmentselect__label');

        expect(lbls.get(0).textContent).toBe('firstname lastname');
        expect(lbls.get(1).textContent).toBe('firstname2 lastname2');
    });

    it('Desks are populated', () => {
        const wrapper = getWrapper();

        wrapper.find('.assignment__action').simulate('click');
        const deskSelectFieldComponent = wrapper.find('DeskSelectField');

        expect(deskSelectFieldComponent.props().desks.length).toBe(2);
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk');
        expect(deskSelectFieldComponent.props().desks[1].name).toBe('Sports Desk');
    });


    it('Coverage Providers are populated', () => {
        const wrapper = getWrapper();

        wrapper.find('.assignment__action').simulate('click');
        const providerList = wrapper.find('select').at(1);

        expect(providerList.children().length).toBe(2);
        expect(providerList.children().at(1)
            .props().value).toBe('ProviderQcode_1');
    });

    it('Selected desk populates only those users who belong that desk and coverage providers', () => {
        const input = {value: {desk: 123}};
        const wrapper = getWrapperWithInput(input);

        wrapper.find('.assignment__action').simulate('click');
        wrapper.find('input').first()
            .simulate('click');
        const lst = wrapper.find('ul');

        expect(lst.children().length).toBe(1);
        const lbls = lst.at(0).find('.assignmentselect__label');

        expect(lbls.get(0).textContent).toBe('firstname lastname');

        const providerList = wrapper.find('select').at(1);

        expect(providerList.children().length).toBe(2);
        expect(providerList.children().at(1)
            .props().value).toBe('ProviderQcode_1');
    });

    it('Selecting a user populates only that user desk', () => {
        const wrapper = getWrapper();

        wrapper.find('.assignment__action').simulate('click');

        const deskSelectFieldComponent = wrapper.find('DeskSelectField');

        expect(deskSelectFieldComponent.props().desks.length).toBe(2);
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk');
        expect(deskSelectFieldComponent.props().desks[1].name).toBe('Sports Desk');

        wrapper.find('input').first()
            .simulate('click');
        const lst = wrapper.find('ul');

        lst.children().first()
            .find('button')
            .simulate('click');

        expect(deskSelectFieldComponent.props().desks.length).toBe(1);
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk');
    });

    it('Cannot save until a desk is selected', () => {
        const wrapper = getWrapper();

        wrapper.find('.assignment__action').simulate('click');

        wrapper.find('input').first()
            .simulate('click');
        const lst = wrapper.find('ul');

        lst.children().first()
            .find('button')
            .simulate('click');

        expect(wrapper.find('.btn--primary').length).toBe(0);
    });

    it('Shows desk assignment correctly with assignor details', () => {
        const inputDate = moment('2014-01-01T14:00');
        const input = {
            value: {
                desk: 123,
                assignor_desk: 345,
                assigned_date_desk: inputDate,
            },
        };
        const wrapper = getWrapperWithInput(input);

        const deskLbl = wrapper.find('.TimeAndAuthor').children()
            .first();

        expect(deskLbl.text()).toBe('Desk: POLITIC DESK (14:00 01/01/2014, FIRSTNAME LASTNAME)');
    });

    it('Shows user assignment correctly with assignor details', () => {
        const inputDate = moment('2014-01-01T14:00');
        const input = {
            value: {
                user: 456,
                assignor_user: 345,
                assigned_date_user: inputDate,
            },
        };
        const wrapper = getWrapperWithInput(input);

        const userLbl = wrapper.find('.TimeAndAuthor').children()
            .last();

        expect(userLbl.text()).toBe('Assignee FIRSTNAME2 LASTNAME2 (14:00 01/01/2014, FIRSTNAME LASTNAME)');
    });

    it('Coverage provider is populated for all desks', () => {
        // Select desk: 123
        let input = {value: {desk: 123}};
        const wrapper = getWrapperWithInput(input);

        wrapper.find('.assignment__action').simulate('click');
        const providerList1 = wrapper.find('select').at(1);

        expect(providerList1.children().length).toBe(2);
        expect(providerList1.children().at(1)
            .props().value).toBe('ProviderQcode_1');

        // Select desk: 234
        input = {value: {desk: 234}};
        const wrapper2 = getWrapperWithInput(input);

        wrapper2.find('.assignment__action').simulate('click');
        const providerList2 = wrapper.find('select').at(1);

        expect(providerList2.children().length).toBe(2);
        expect(providerList2.children().at(1)
            .props().value).toBe('ProviderQcode_1');
    });

    it('Selecting a coverage provider displays all desks', () => {
        const wrapper = getWrapper();

        wrapper.find('.assignment__action').simulate('click');

        const deskSelectFieldComponent = wrapper.find('DeskSelectField');

        expect(deskSelectFieldComponent.props().desks.length).toBe(2);
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk');
        expect(deskSelectFieldComponent.props().desks[1].name).toBe('Sports Desk');

        const providerList = wrapper.find('select').at(1);

        expect(providerList.children().length).toBe(2);
        expect(providerList.children().at(1)
            .props().value).toBe('ProviderQcode_1');
        providerList.children().at(1)
            .simulate('click');

        expect(deskSelectFieldComponent.props().desks.length).toBe(2);
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk');
        expect(deskSelectFieldComponent.props().desks[1].name).toBe('Sports Desk');
    });

    it('Desk selection is disabled by if falsy value to deskSelectionDisabled prop', () => {
        const wrapper = mount(<Provider store={store}>
            <TestForm users={users} desks={desks} deskSelectionDisabled={true} />
        </Provider>);

        wrapper.find('.assignment__action').simulate('click');

        const deskSelectFieldComponent = wrapper.find('DeskSelectField');

        expect(deskSelectFieldComponent.props().desks.length).toBe(2);
        expect(deskSelectFieldComponent.props().desks[0].name).toBe('Politic Desk');
        expect(deskSelectFieldComponent.props().desks[1].name).toBe('Sports Desk');
        expect(deskSelectFieldComponent.props().readOnly).toBe(true);
    });

    it('Priority selection is available only in coverage context', () => {
        const wrapper = getWrapper();

        wrapper.find('.assignment__action').simulate('click');
        expect(wrapper.find('.assignmentselect__priority').length).toBe(1);

        const wrapper2 = mount(<Provider store={store}>
            <TestForm users={users} desks={desks} context="assignment" />
        </Provider>);

        wrapper2.find('.assignment__action').simulate('click');
        expect(wrapper2.find('.assignmentselect__priority').length).toBe(0);
    });

    it('Default priority is 2 or Medium', () => {
        const wrapper = getWrapper();

        wrapper.find('.assignment__action').simulate('click');
        const priorityNode = wrapper.find('.assignmentselect__priority').first();
        const priorityButton = priorityNode.find('button').first();

        expect(priorityButton.text()).toEqual('2  Medium');
    });

    it('Input priority is shown', () => {
        let input = {value: {priority: 1}};
        const wrapper = getWrapperWithInput(input);

        const priorityButton = wrapper.find('button').last();

        expect(priorityButton.text()).toBe('1  High');
    });

    it('Displays all priority options', () => {
        let input = {value: {priority: 1}};
        const wrapper = getWrapperWithInput(input);

        wrapper.find('.assignment__action').simulate('click');
        const priorityNode = wrapper.find('.assignmentselect__priority').first();

        priorityNode.simulate('click');

        const priorityButton = priorityNode.find('button').first();

        priorityButton.simulate('click');

        const priorityListOptions = priorityNode.find('li');

        expect(priorityListOptions.length).toBe(3);
        expect(priorityListOptions.at(0).find('button')
            .text()).toEqual('1  High');
        expect(priorityListOptions.at(1).find('button')
            .text()).toEqual('2  Medium');
        expect(priorityListOptions.at(2).find('button')
            .text()).toEqual('3  Low');
    });
});
