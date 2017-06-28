import React from 'react'
import { mount } from 'enzyme'
import { ModalWithForm, CreateEditAgendaForm } from '../index'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'

describe('<ModalWithForm />', () => {
    it('open the modal', () => {
        let store = createTestStore()
        const wrapper = mount(
            <Provider store={store}>
                <ModalWithForm
                    title="Title"
                    form={CreateEditAgendaForm}
                    initialValues={{ field: 'value' }}
                    show={true} />
            </Provider>
        )
        expect(wrapper.find('ModalWithForm').props().title).toBe('Title')
        expect(wrapper.find('ModalWithForm').props().show).toBe(true)
        expect(wrapper.find('ModalWithForm').props().initialValues)
        .toEqual({ field: 'value' })
    })
})
