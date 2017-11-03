import React from 'react'
import { mount } from 'enzyme'
import { GeoLookupInputComponent } from './index'
import sinon from 'sinon'

describe('<AddGeoLookupInput />', () => {
    it('calls location search action on typeahead', () => {
        const inputText = { target: { value: 'Syd' } }
        const initialValue = { name: 'Timbaktu' }

        let wrapper
        const onChange = (val) => {
            expect(val.name).toBe('Syd')
            wrapper.setProps({ initialValue: val })
        }

        const handleSearch = sinon.spy()

        wrapper = mount(<GeoLookupInputComponent initialValue={initialValue} onChange={onChange} searchLocalLocations={handleSearch} />)
        wrapper.instance().handleInputChange(inputText)

        expect(handleSearch.callCount).toBe(1)
    })

    it('opens search external popup on text input', () => {
        const inputText = { target: { value: 'Syd' } }
        const initialValue = { name: 'Timbaktu' }

        let wrapper
        const onChange = (val) => {
            expect(val.name).toBe('Syd')
            wrapper.setProps({ initialValue: val })
        }

        const handleSearch = sinon.spy()

        wrapper = mount(<GeoLookupInputComponent initialValue={initialValue} onChange={onChange} searchLocalLocations={handleSearch} />)
        wrapper.instance().handleInputChange(inputText)

        const suggestsPopup = wrapper.find('.addgeolookup__suggests-wrapper').at(0)
        expect(suggestsPopup.find('button').length).toBe(1)
    })

    it('invokes external search', () => {
        const inputText = { target: { value: 'Syd' } }
        const initialValue = { name: 'Timbaktu' }

        let wrapper
        const onChange = (val) => {
            expect(val.name).toBe('Syd')
            wrapper.setProps({ initialValue: val })
        }
        const handleSearch = sinon.spy()
        wrapper = mount(<GeoLookupInputComponent initialValue={initialValue} onChange={onChange} searchLocalLocations={handleSearch} />)
        wrapper.instance().handleInputChange(inputText)
        const externalSearchSpy = sinon.stub(wrapper.instance(),
            'handleSearchClick').callsFake(() => { })
        wrapper.update()

        const suggestsPopup = wrapper.find('.addgeolookup__suggests-wrapper').at(0)
        expect(suggestsPopup.find('button').length).toBe(1)
        suggestsPopup.find('button').at(0).simulate('click')

        // expect(externalSearchSpy.called).toBe(true)
        expect(externalSearchSpy.callCount).toBe(1)
    })

    it('external search button can be controlled by disableSearch prop', () => {
        const inputText = { target: { value: 'Syd' } }
        const initialValue = { name: 'Timbaktu' }

        let wrapper
        const onChange = (val) => {
            expect(val.name).toBe('Syd')
            wrapper.setProps({ initialValue: val })
        }
        const handleSearch = sinon.spy()
        wrapper = mount(<GeoLookupInputComponent initialValue={initialValue} onChange={onChange} searchLocalLocations={handleSearch} />)
        wrapper.instance().handleInputChange(inputText)

        let suggestsPopup = wrapper.find('.addgeolookup__suggests-wrapper').at(0)
        let searchExternalButton = suggestsPopup.find('button')
        expect(searchExternalButton.length).toBe(1)
        expect(searchExternalButton.text()).toBe('Search External')

        wrapper = mount(<GeoLookupInputComponent initialValue={initialValue} onChange={onChange} searchLocalLocations={handleSearch}
            disableSearch={true} />)
        wrapper.instance().handleInputChange(inputText)

        suggestsPopup = wrapper.find('.addgeolookup__suggests-wrapper').at(0)
        searchExternalButton = suggestsPopup.find('button')
        expect(searchExternalButton.length).toBe(0)
    })
})
