import React from 'react'
import { mount } from 'enzyme'
import { GeoLookupInput } from '../index'

class TestForm extends React.Component {
    render() {
        const { input, meta } = this.props
        return (
            <GeoLookupInput
            input={input}
            meta={meta} />
        )
    }
}

TestForm.propTypes = {
    input: React.PropTypes.object.isRequired,
    meta: React.PropTypes.object.isRequired,
}

describe('<GeoLookupInput />', () => {
    it('Displays type label of the location', () => {
        const input = {
            value: {
                name: 'Paris',
                qcode: 'news_article_123',
                type: 'city',
                location: {
                    lat: 2.345,
                    lon: 7.456,
                },
            },
            onChange: { },
        }
        const meta = { }

        const wrapper = mount(<TestForm input={input} meta={meta}/>)
        const typeNode = wrapper.find('.addgeolookup__suggestItemLabel').get(0)
        expect(typeNode.textContent).toBe('city')
    })
})
