import React, {PropTypes} from 'react';
import {mount} from 'enzyme';
import {UnlockItem} from '../index';
import sinon from 'sinon';

class TestForm extends React.Component {
    render() {
        const {user, onUnlock, displayText} = this.props;

        return (
            <UnlockItem
                user={user}
                onUnlock={onUnlock}
                showUnlock={true}
                onCancel={() => {}}
                displayText={displayText} />
        );
    }
}

TestForm.propTypes = {
    user: PropTypes.object.isRequired,
    onUnlock: React.PropTypes.func,
    displayText: PropTypes.string,
};

describe('<UnlockItem />', () => {
    it('Unlock button will invoke onUnlock prop function', () => {
        const onUnlock = sinon.spy();
        const user = {display_name: 'firstname lastname'};
        const wrapper = mount(<TestForm user={user} onUnlock={onUnlock} />);

        wrapper.find('.btn').simulate('click');
        expect(onUnlock.calledOnce).toBe(true);
    });

    it('Populates custom text message in the pop-up', () => {
        const onUnlock = sinon.spy();
        const user = {display_name: 'firstname lastname'};
        const wrapper = mount(<TestForm user={user} onUnlock={onUnlock} displayText="Content locked by:" />);
        const textNode = wrapper.find('.dropdown__menu-label');

        expect(textNode.text()).toBe('Content locked by:');
    });
});