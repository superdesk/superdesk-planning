import React from 'react';
import { gettext } from '../utils';

function FiltersBox() {
    const filters = [
        {
            label: gettext('Events & Planning'),
        },
        {
            label: gettext('Events only'),
        },
        {
            label: gettext('Planning only'),
        },
    ];

    return (
        <div className="subnav__stretch-bar">
            {filters.map((filter) => (
                <span className="sd-check__wrapper" key={filter.label}>
                    <span className="sd-checkbox sd-checkbox--button-style">
                        <label>{filter.label}</label>
                    </span>
                </span>
            ))}
        </div>
    );
}

export default FiltersBox;
