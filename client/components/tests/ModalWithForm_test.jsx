import React from 'react'
import { mount } from 'enzyme'
import { ModalWithForm, CreateAgendaForm } from '../index'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'

describe('<ModalWithForm />', () => {
    it('open the modal', () => {
        let store = createTestStore()
        const wrapper = mount(
            <Provider store={store}>
                <ModalWithForm
                    title="Title"
                    form={CreateAgendaForm}
                    initialValues={{ field: 'value' }}
                    show={true} />
            </Provider>
        )
        expect(wrapper.find('ModalWithFormComponent').props().title).toBe('Title')
        expect(wrapper.find('ModalWithFormComponent').props().show).toBe(true)
        expect(wrapper.find('ModalWithFormComponent').props().initialValues)
        .toEqual({ field: 'value' })
    })
})
