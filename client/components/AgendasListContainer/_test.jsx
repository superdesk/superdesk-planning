import React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {createTestStore} from '../../utils';
import {AgendasListContainer} from './index';
import {Provider} from 'react-redux';
import {ModalsContainer, ModalWithForm} from '../../components';

describe('<AgendasListContainer />', () => {
    const initialState = {
        agenda: {
            agendas: [
                {
                    _id: 'a1',
                    name: 'TestAgenda',
                    is_enabled: true,
                },
                {
                    _id: 'a2',
                    name: 'TestAgenda2',
                    is_enabled: true,
                },
                {
                    _id: 'a3',
                    name: 'TestAgenda3',
                    is_enabled: false,
                },
            ],
        },
        privileges: {
            planning: 1,
            planning_agenda_management: 1,
        },
        users: [{_id: 'user123'}],
        session: {
            identity: {_id: 'user123'},
            sessionId: 'session123',
        },
    };

    const store = createTestStore({initialState});
    const wrapper = mount(
        <Provider store={store}>
            <div>
                <AgendasListContainer />
                <ModalsContainer/>
            </div>
        </Provider>
    );

    it('enabled agendas', () => {
        expect(wrapper.find('.agenda-group').length).toBe(2);
        const enabledAgendas = wrapper.find('.agenda-group').first();

        expect(enabledAgendas.find('.sd-list-item').length).toBe(2);
    });

    it('disabled agendas', () => {
        expect(wrapper.find('.agenda-group').length).toBe(2);
        const enabledAgendas = wrapper.find('.agenda-group').last();

        expect(enabledAgendas.find('.sd-list-item').length).toBe(1);
    });

    it('open the create agenda modal', () => {
        const createButton = wrapper.find('.btn--primary').first();

        createButton.simulate('click');
        const form = wrapper.find(ModalWithForm);
        const formProps = form.props();

        expect(formProps.title).toBe('Create an Agenda');
        expect(formProps.large).toBe(true);
        expect(formProps.show).toBe(true);
        const dialog = wrapper.find('Portal');
        const modal = new ReactWrapper(<Provider store={store}>{dialog.node.props.children}</Provider>);

        expect(modal.text()).toContain('Create an Agenda');
    });

    it('open the edit agenda modal', () => {
        expect(wrapper.find('.icon-pencil').length).toBe(3);
        const editAgenda = wrapper.find('.icon-pencil').first()
            .parent();

        editAgenda.simulate('click');
        const form = wrapper.find(ModalWithForm);
        const formProps = form.props();

        expect(formProps.title).toBe('Edit an Agenda');
        expect(formProps.large).toBe(true);
        expect(formProps.show).toBe(true);
        expect(formProps.initialValues.name).toBe('TestAgenda');
        expect(formProps.initialValues.is_enabled).toBe(true);
        const dialog = wrapper.find('Portal');
        const modal = new ReactWrapper(<Provider store={store}>{dialog.node.props.children}</Provider>);

        expect(modal.text()).toContain('Edit an Agenda');
    });
});
