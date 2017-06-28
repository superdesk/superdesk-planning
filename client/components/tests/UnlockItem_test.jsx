import React, { PropTypes } from 'react'
import { mount } from 'enzyme'
import { UnlockItem } from '../index'
import sinon from 'sinon'

class TestForm extends React.Component {
    render() {
        const { user, onUnlock } = this.props
        return (
            <UnlockItem
            user={user}
            onUnlock={onUnlock}
            showUnlock={true}
            onCancel={() => {}} />
        )
    }
}

TestForm.propTypes = {
    user: PropTypes.object.isRequired,
    onUnlock: React.PropTypes.func,
}

describe('<UnlockItem />', () => {
    it('Unlock button will invoke onUnlock prop function', () => {
        const onUnlock = sinon.spy()
        const user = { display_name: 'firstname lastname' }
        const wrapper = mount(<TestForm user={user} onUnlock={onUnlock} />)
        wrapper.find('.btn').simulate('click')
        expect(onUnlock.calledOnce).toBe(true)
    })
})