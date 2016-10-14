import React from 'react';
import { shallow } from 'enzyme';
// import sinon from 'sinon';

import { EventsList } from './index';
// import Foo from './Foo';

describe('<EventsList />', () => {
    it('renders events', () => {
        let events = [
            {
                _id: '5800d71930627218866f1e80',
                event_details: {
                    dates: { start: '2016-10-15T13:01:11+0000' },
                    description: { definition_short: 'faire du poney' },
                    location: [{ name: 'poney club' }]
                },
                unique_name: 'Poney'
            },
            {
                _id: '5800d73230627218866f1e82',
                event_details: {
                    dates: {
                        end: '2016-10-19T13:01:50+0000',
                        start: '2016-10-17T13:01:34+0000'
                    },
                    description: { definition_short: '' },
                    location: [{ name: 'Finanzamt' }]
                },
                unique_name: 'Pay taxes'
            }
        ];
        const wrapper = shallow(<EventsList events={events}/>);
        expect(wrapper.find('li').length).toEqual(events.length);
    });

    // it('renders an `.icon-star`', () => {
    //     const wrapper = shallow(<EventsList />);
    //     expect(wrapper.find('.icon-star')).to.have.length(1);
    // });
    //
    // it('renders children when passed in', () => {
    //     const wrapper = shallow(
    //         <EventsList>
    //             <div className="unique" />
    //         </EventsList>
    //     );
    //     expect(wrapper.contains(<div className="unique" />)).to.equal(true);
    // });
    //
    // it('simulates click events', () => {
    //     const onButtonClick = sinon.spy();
    //     const wrapper = shallow(
    //         <Foo onButtonClick={onButtonClick} />
    //     );
    //     wrapper.find('button').simulate('click');
    //     expect(onButtonClick).to.have.property('callCount', 1);
    // });
});
