import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import {createTestStore} from '../../utils';
import {Location} from './index';

describe('<Location />', () => {
    let name;
    let address;
    let store;
    let wrapper;

    beforeEach(() => {
        name = 'location_name';
        address = 'location_address';
        store = createTestStore();
    });

    it('render single line', () => {
        wrapper = mount(
            <Provider store={store}>
                <Location name={name} address={address}/>
            </Provider>
        );

        expect(wrapper.text()).toBe(name);
        expect(wrapper.html()).toBe('<span class="sd-list-item__location">location_name</span>');
        wrapper = mount(
            <Provider store={store}>
                <Location address={address}/>
            </Provider>
        );

        expect(wrapper.text()).toBe(address);
        expect(wrapper.html()).toBe('<span class="sd-list-item__location">location_address</span>');
    });

    it('render single line with map', () => {
        wrapper = mount(
            <Provider store={store}>
                <Location name={name} address={address} mapUrl={'http://www.google.com/?q='}/>
            </Provider>
        );

        expect(wrapper.text()).toBe(name);
        expect(wrapper.find('a').prop('title')).toBe('Show on map');
        expect(wrapper.find('a').prop('href')).toBe('http://www.google.com/?q=location_name location_address');
    });

    it('render multi line', () => {
        wrapper = mount(
            <Provider store={store}>
                <Location name={name} address={address} multiLine={true}/>
            </Provider>
        );

        expect(wrapper.text()).toBe(name + address);
        expect(wrapper.find('i').html()).toBe('<i class="icon-map-marker icon--gray"></i>');
        expect(wrapper.find('div.sd-line-input__input--address').text()).toBe(address);
    });

    it('render multi line with map', () => {
        wrapper = mount(
            <Provider store={store}>
                <Location
                    name={name}
                    address={address}
                    mapUrl={'http://www.google.com/?q='}
                    multiLine={true}
                />
            </Provider>
        );

        expect(wrapper.text()).toBe(name + address);
        expect(wrapper.find('i').html()).toBe('<i class="icon-map-marker icon--gray"></i>');
        expect(wrapper.find('div.sd-line-input__input--address').text()).toBe(address);
        expect(wrapper.find('a').prop('title')).toBe('Show on map');
        expect(wrapper.find('a').prop('href')).toBe('http://www.google.com/?q=location_name location_address');
    });
});
