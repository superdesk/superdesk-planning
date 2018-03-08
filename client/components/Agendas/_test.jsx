import React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {Provider} from 'react-redux';
import {getTestActionStore} from '../../utils/testUtils';
import {createTestStore} from '../../utils';
import {List} from '../UI/';
import {ManageAgendasModal} from './index';

describe('ManageAgendas', () => {
    describe('<ManageAgendasModal />', () => {
        let astore = getTestActionStore();
        let wrapper, modal, store, services;

        const getModal = (update = false) => {
            if (update) {
                wrapper.update();
            } else {
                services = astore.services;
                store = createTestStore({
                    initialState: astore.initialState,
                    extraArguments: {
                        api: services.api,
                        $location: services.$location,
                    },
                });
                wrapper = mount(<Provider store={store}>
                    <ManageAgendasModal />
                </Provider>);
            }

            const dialog = wrapper.find('Portal');

            modal = new ReactWrapper(<Provider store={store}>{dialog.getElement()}</Provider>);
            return modal;
        };

        beforeEach(() => {
            astore.init();
        });

        it('show agendas', () => {
            modal = getModal();
            expect(modal.find(List.Item).length).toBe(3);
        });

        it('enabled agendas', () => {
            modal = getModal();
            expect(modal.find('.sd-list-item__border--active').length).toBe(2);
        });

        it('disabled agendas', () => {
            modal = getModal();
            expect(modal.find('.sd-list-item__border--idle').length).toBe(1);
        });

        it('if privileges are enabled', () => {
            modal = getModal();
            expect(modal.find('.icon-pencil').length).toBe(3);
            expect(modal.find('.icon-trash').length).toBe(3);
        });

        it('if privileges are disabled', () => {
            astore.initialState.privileges.planning_agenda_management = 0;
            modal = getModal();
            expect(modal.find('.icon-pencil').length).toBe(0);
            astore.initialState.privileges.planning_agenda_management = 1;
        });

        describe('<EditCreate />', () => {
            it('Pencil icon will open agenda editor', () => {
                modal = getModal();
                const agendaItem = modal.find(List.Item).first();

                agendaItem.find('.icon-pencil').first()
                    .simulate('click');
                modal = getModal(true);
                expect(modal.find('EditAgenda').length).toBe(1);
            });

            it('Create new agenda button icon will open agenda editor', () => {
                modal = getModal();
                const createAgendaButton = modal.find('.btn--primary').first();

                createAgendaButton.simulate('click');
                modal = getModal(true);
                expect(modal.find('EditAgenda').length).toBe(1);
            });

            it('During agenda edit', () => {
                modal = getModal();

                // Open editor
                const agendaItem = modal.find(List.Item).first();

                agendaItem.find('.icon-pencil').first()
                    .simulate('click');
                modal = getModal(true);
                expect(modal.find('EditAgenda').length).toBe(1);

                // Cannot create new agenda
                const createAgendaIcon = modal.find('.icon-plus-sign');

                expect(createAgendaIcon.length).toBe(0);

                // No pencil icon visible on agenda items
                expect(modal.find('.icon-pencil').length).toBe(0);

                // Changing data in editor brings up save button
                const editAgendaInstance1 = modal.find('EditAgenda').first();
                const nameField = editAgendaInstance1.find('input').first();

                nameField.simulate('change', {target: {value: 'new name'}});
                expect(modal.find('EditAgenda').first()
                    .find('.btn--primary').length).toBe(1);

                // Name is mandatory
                nameField.simulate('change', {target: {value: ''}});
                const editAgendaInstance2 = modal.find('EditAgenda').first();

                expect(editAgendaInstance2.find('.btn--primary').length).toBe(0);
            });

            it('Save updated agenda item', () => {
                modal = getModal();

                // Open editor
                const agendaItem = modal.find(List.Item).first();

                agendaItem.find('.icon-pencil').first()
                    .simulate('click');
                modal = getModal(true);

                // Changing name
                const editAgendaInstance1 = modal.find('EditAgenda').first();
                const nameField = editAgendaInstance1.find('input').first();

                nameField.simulate('change', {target: {value: 'new name'}});

                // Save
                const saveButton = modal.find('EditAgenda').first()
                    .find('.btn--primary')
                    .first();

                saveButton.simulate('click');

                expect(services.api('agenda').save.callCount).toBe(1);
            });
        });
    });
});
