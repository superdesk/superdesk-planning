import { shallow } from 'enzyme'
import { InputField } from '../index'

describe('InputField', () => {
    it('renders an error when an input is in an error state', () => {
        const input = { name: 'uniqueName', value: '' }
        const label = 'Label'
        const meta = { touched: true, error: 'Required' }
        const element = InputField({ input, label, meta })
        const subject = shallow(element)
        const uniqueNameHelpBlock = subject.find('.help-block')
        expect(uniqueNameHelpBlock.length).toBe(1)
        expect(uniqueNameHelpBlock.first().text()).toBe('Required')
    })
})
