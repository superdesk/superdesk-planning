import React from 'react';
import {mount} from 'enzyme';
import sinon from 'sinon';

import {SelectMetaTermsInput} from './index';
import TermsList from '../../TermsList';

describe('SelectMetaTermsInput', () => {
    const value = [
        {
            name: 'Entertainment',
            qcode: 'e',
            scheme: 'categories',
        },
        {
            name: 'Lifestyle',
            qcode: 'l',
            scheme: 'categories',
        },
    ];
    const options = [
        {
            name: 'Entertainment',
            qcode: 'e',
        },
        {
            name: 'Lifestyle',
            qcode: 'l',
        },
    ];

    it('keeps the existing remove matching by default', () => {
        const onChange = sinon.spy();

        const wrapper = mount(
            <SelectMetaTermsInput
                field="anpa_category"
                label="ANPA Category"
                onChange={onChange}
                options={options}
                value={value}
            />
        );

        wrapper.find(TermsList).prop('onClick')(0, options[0]);

        expect(onChange.callCount).toBe(1);
        expect(onChange.args[0]).toEqual(['anpa_category', value]);
    });

    it('removes stored values by qcode when ignoreScheme is enabled', () => {
        const onChange = sinon.spy();

        const wrapper = mount(
            <SelectMetaTermsInput
                field="anpa_category"
                label="ANPA Category"
                onChange={onChange}
                options={options}
                value={value}
                ignoreScheme={true}
            />
        );

        wrapper.find(TermsList).prop('onClick')(0, options[0]);

        expect(onChange.callCount).toBe(1);
        expect(onChange.args[0]).toEqual(['anpa_category', [value[1]]]);
    });
});