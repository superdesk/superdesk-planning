/* eslint-disable react/no-multi-comp */
import React from 'react'
import { mount } from 'enzyme'
import { CategoryField, SubjectField } from '../index'
import { createTestStore } from '../../../utils'
import { Provider } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import simulant from 'simulant'

const vocabularies ={
    categories: [
        {
            name: 'cat1',
            qcode: 'qcode1',
        },
        {
            name: 'cat2',
            qcode: 'qcode2',
        },
        {
            name: 'cat3',
            qcode: 'qcode3',
        }],
}

const subjects = [
    {
        name: 'sub1',
        qcode: 'qcode1',
        parent: null,
    },
    {
        name: 'sub1-1',
        qcode: 'qcode1-1',
        parent: 'qcode1',
    },
    {
        name: 'sub2',
        qcode: 'qcode2',
        parent: null,
    },
    {
        name: 'sub2-2',
        qcode: 'qcode2-2',
        parent: 'qcode2',
    },
]

const renderComponentField = (component) => (
    () => (
        <Field name="field_name"
               component={component}/>
    )
)

const renderComponentFieldWithInput = (component, input) => (
    () => (
        <Field name="field_name"
               component={component}
               input={input}/>
    )
)

describe('<SelectMetaTermsField />', () => {
    it('Can open pop selected pop-up', () => {
        const FormComponent = reduxForm({ form: 'form' })(renderComponentField(CategoryField))
        const initialState = { vocabularies: vocabularies }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )

        wrapper.find('.Select__dropdownToggle').simulate('click')
        expect(wrapper.find('.Select__popup').length).toBe(1)
    })
    it('Displays all options passed in props', () => {
        const FormComponent = reduxForm({ form: 'form' })(renderComponentField(CategoryField))
        const initialState = { vocabularies: vocabularies }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )

        wrapper.find('.Select__dropdownToggle').simulate('click')
        expect(wrapper.find('.Select__popup__item').length).toBe(3)
    })
    it('Displays all values passed in props', () => {
        const input = { value: vocabularies.categories }
        const FormComponent = reduxForm({ form: 'form' })(renderComponentFieldWithInput(CategoryField, input))
        const initialState = { vocabularies: vocabularies }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )
        const valueList = wrapper.find('ul').children()
        expect(valueList.length).toBe(3)
        expect(valueList.at(0).text()).toBe('cat1')
        expect(valueList.at(1).text()).toBe('cat2')
        expect(valueList.at(2).text()).toBe('cat3')
    })
    it('Can cancel or delete value', () => {
        const input = {
            value: vocabularies.categories,
            onChange: (vals) => {
                expect(vals.find((v)=>(v.qcode === 'qcode1'))).toBe(undefined)
                expect(vals.length).toBe(2)
            },
        }
        const FormComponent = reduxForm({ form: 'form' })(renderComponentFieldWithInput(CategoryField, input))
        const initialState = { vocabularies: vocabularies }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )
        const valueList = wrapper.find('ul').children()
        expect(valueList.length).toBe(3)
        valueList.at(0).find('.icon-close-small').simulate('click')
    })
    it('Can select an option', () => {
        const input = {
            onChange: (vals) => {
                expect(vals[0].qcode).toBe('qcode1')
                expect(vals.length).toBe(1)
            },
        }
        const FormComponent = reduxForm({ form: 'form' })(renderComponentFieldWithInput(CategoryField, input))
        const initialState = { vocabularies: vocabularies }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )
        wrapper.find('.Select__dropdownToggle').simulate('click')
        const optionsLst = wrapper.find('.Select__popup__list')
        optionsLst.children().at(0).find('button').simulate('click')
    })
    it('Displays parent level options correctly', () => {
        const FormComponent = reduxForm({ form: 'form' })(renderComponentField(SubjectField))
        const initialState = { subjects: subjects }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )
        wrapper.find('.Select__dropdownToggle').simulate('click')
        const parentList = wrapper.find('.icon-chevron-right-thin')
        expect(parentList.length).toBe(2)
    })
    it('Displays next level options upon selecting parent option', () => {
        const FormComponent = reduxForm({ form: 'form' })(renderComponentField(SubjectField))
        const initialState = { subjects: subjects }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )
        wrapper.find('.Select__dropdownToggle').simulate('click')
        const parentLst = wrapper.find('.Select__popup__item')
        parentLst.at(0).find('button').simulate('click')
        const optionsLst = wrapper.find('.Select__popup__item--active')
        expect(optionsLst.length).toBe(1)
        expect(optionsLst.at(0).text()).toBe('sub1-1')
    })
    it('Can traverse a level up from child to parent', () => {
        const FormComponent = reduxForm({ form: 'form' })(renderComponentField(SubjectField))
        const initialState = { subjects: subjects }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )
        wrapper.find('.Select__dropdownToggle').simulate('click')
        const parentLst = wrapper.find('.Select__popup__item')
        expect(parentLst.length).toBe(2)
        parentLst.at(0).find('button').simulate('click')
        const optionsLst = wrapper.find('.Select__popup__item--active')
        expect(optionsLst.length).toBe(1)
        expect(optionsLst.at(0).text()).toBe('sub1-1')
        wrapper.find('.backlink').simulate('click') // Traverse a level up
        const parentLst2 = wrapper.find('.Select__popup__item')
        expect(parentLst2.length).toBe(2)
    })
    it('Can choose an entire parent option', () => {
        const input = {
            onChange: (vals) => {
                expect(vals[0].qcode).toBe('qcode1')
                expect(vals.length).toBe(1)
            },
        }
        const FormComponent = reduxForm({ form: 'form' })(renderComponentFieldWithInput(SubjectField, input))
        const initialState = { subjects: subjects }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )
        wrapper.find('.Select__dropdownToggle').simulate('click')
        const parentLst = wrapper.find('.Select__popup__item')
        expect(parentLst.length).toBe(2)
        parentLst.at(0).find('button').simulate('click')
        const optionsLst = wrapper.find('.Select__popup__item')
        expect(optionsLst.length).toBe(1)
        expect(optionsLst.at(0).text()).toBe('sub1-1')
        wrapper.find('.Select__popup__category').simulate('click') // Choose the entire category
    })
    it('Can choose a child option as a value', () => {
        const input = {
            onChange: (vals) => {
                expect(vals[0].qcode).toBe('qcode1-1')
                expect(vals.length).toBe(1)
            },
        }
        const FormComponent = reduxForm({ form: 'form' })(renderComponentFieldWithInput(SubjectField, input))
        const initialState = { subjects: subjects }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )
        wrapper.find('.Select__dropdownToggle').simulate('click')
        const parentLst = wrapper.find('.Select__popup__item')
        expect(parentLst.length).toBe(2)
        parentLst.at(0).find('button').simulate('click')
        const optionsLst = wrapper.find('.Select__popup__item')
        expect(optionsLst.length).toBe(1)
        expect(optionsLst.at(0).text()).toBe('sub1-1')
        optionsLst.at(0).find('button').simulate('click')
    })
    it('Can traverse down options by arrowDown key', () => {
        const FormComponent = reduxForm({ form: 'form' })(renderComponentField(SubjectField))
        const initialState = { subjects: subjects }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>,
            { attachTo: document.body }
        )
        wrapper.find('.Select__dropdownToggle').simulate('click')
        const event = simulant('keydown', { keyCode: 40 })
        simulant.fire(document.body.querySelector('.Select__popup'), event)
        const activeOption = wrapper.find('.Select__popup__item--active')
        expect(activeOption.length).toBe(1)
    })
    it('Can traverse up options by arrowDown key', () => {
        const FormComponent = reduxForm({ form: 'form' })(renderComponentField(SubjectField))
        const initialState = { subjects: subjects }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>,
            { attachTo: document.body }
        )
        wrapper.find('.Select__dropdownToggle').simulate('click')
        const downEvent = simulant('keydown', { keyCode: 40 })
        simulant.fire(document.body.querySelector('.Select__popup'), downEvent)
        const activeOption = wrapper.find('.Select__popup__item--active')
        expect(activeOption.length).toBe(1)
        const upEvent = simulant('keydown', { keyCode: 38 })
        simulant.fire(document.body.querySelector('.Select__popup'), upEvent)
        const activeOption2 = wrapper.find('.Select__popup__item--active')
        expect(activeOption2.length).toBe(0)
    })
    it('ESC key will close popup', () => {
        const FormComponent = reduxForm({ form: 'form' })(renderComponentField(SubjectField))
        const initialState = { subjects: subjects }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>,
            { attachTo: document.body }
        )
        wrapper.find('.Select__dropdownToggle').simulate('click')
        const escEvent = simulant('keydown', { keyCode: 27 })
        simulant.fire(document.body.querySelector('.Select__popup'), escEvent)
        expect(wrapper.find('.Select__popup').length).toBe(0)
    })
    it('Right arrow key press on parent option will open the parent category', () => {
        const FormComponent = reduxForm({ form: 'form' })(renderComponentField(SubjectField))
        const initialState = { subjects: subjects }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>,
            { attachTo: document.body }
        )
        wrapper.find('.Select__dropdownToggle').simulate('click')
        const downEvent = simulant('keydown', { keyCode: 40 })
        simulant.fire(document.body.querySelector('.Select__popup'), downEvent)
        const activeOption = wrapper.find('.Select__popup__item--active')
        expect(activeOption.length).toBe(1)
        const rightEvent = simulant('keydown', { keyCode: 39 })
        simulant.fire(document.body.querySelector('.Select__popup'), rightEvent)
        const optionsLst = wrapper.find('.Select__popup__item')
        expect(optionsLst.length).toBe(1)
        expect(optionsLst.at(0).text()).toBe('sub1-1')
    })
    it('Left arrow key will navigate to previous parent category', () => {
        const FormComponent = reduxForm({ form: 'form' })(renderComponentField(SubjectField))
        const initialState = { subjects: subjects }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>,
            { attachTo: document.body }
        )
        wrapper.find('.Select__dropdownToggle').simulate('click')
        const downEvent = simulant('keydown', { keyCode: 40 })
        simulant.fire(document.body.querySelector('.Select__popup'), downEvent)
        const activeOption = wrapper.find('.Select__popup__item--active')
        expect(activeOption.length).toBe(1)
        const rightEvent = simulant('keydown', { keyCode: 39 })
        simulant.fire(document.body.querySelector('.Select__popup'), rightEvent)
        const optionsLst = wrapper.find('.Select__popup__item')
        expect(optionsLst.length).toBe(1)
        expect(optionsLst.at(0).text()).toBe('sub1-1')
        const leftEvent = simulant('keydown', { keyCode: 37 })
        simulant.fire(document.body.querySelector('.Select__popup'), leftEvent)
        const optionsLst2 = wrapper.find('.Select__popup__item')
        expect(optionsLst2.length).toBe(2)
    })
    it('Enter key will select the option', () => {
        const input = {
            onChange: (vals) => {
                expect(vals[0].qcode).toBe('qcode1')
                expect(vals.length).toBe(1)
            },
        }
        const FormComponent = reduxForm({ form: 'form' })(renderComponentFieldWithInput(SubjectField, input))
        const initialState = { subjects: subjects }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>,
            { attachTo: document.body }
        )
        wrapper.find('.Select__dropdownToggle').simulate('click')
        const downEvent = simulant('keydown', { keyCode: 40 })
        simulant.fire(document.body.querySelector('.Select__popup'), downEvent)
        const activeOption = wrapper.find('.Select__popup__item--active')
        expect(activeOption.length).toBe(1)
        const enterEvent = simulant('keydown', { keyCode: 13 })
        simulant.fire(document.body.querySelector('.Select__popup'), enterEvent)
    })
    it('CategoryField', () => {
        const FormComponent = reduxForm({ form: 'form' })(renderComponentField(CategoryField))
        const initialState = { vocabularies: vocabularies }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )
        wrapper.find('SelectMetaTermsField').props().onChange({
            name: 'lab',
            value: { name: 'lab' },
        }, wrapper.find('SelectMetaTermsField').props(), () => {})
        expect(wrapper.find('SelectMetaTermsField').props().value[0].label).toEqual('lab')
        expect(wrapper.find('SelectMetaTermsField').props().options[0].label).toEqual('cat1')
    })
    it('SubjectField', () => {
        const FormComponent = reduxForm({ form: 'form' })(renderComponentField(SubjectField))
        const initialState = {
            subjects: [{
                name: 'sub',
                qcode: 'qcode',
            }],
        }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent/>
            </Provider>
        )
        wrapper.find('SelectMetaTermsField').props().onChange({
            name: 'lab',
            value: { name: 'lab' },
        }, wrapper.find('SelectMetaTermsField').props(), () => {})
        expect(wrapper.find('SelectMetaTermsField').props().value[0].label).toEqual('lab')
        expect(wrapper.find('SelectMetaTermsField').props().options[0].label).toEqual('sub')
    })
})