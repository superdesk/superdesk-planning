import React from 'react';
import PropTypes from 'prop-types';

import {gettext, planningUtils} from '../../utils';
import {Dropdown} from '../UI/SubNav';

export const CoverageAddButton = ({onAdd, contentTypes}) => {
    let items = contentTypes.map((c) => (
        {
            id: `coverage-menu-add-${c.qcode}`,
            label: c.name,
            icon: planningUtils.getCoverageIcon(c.qcode),
            action: onAdd.bind(null, c.qcode),
        }
    ));

    return (
        <Dropdown
            icon="icon-plus-large"
            label={gettext('Coverage type')}
            items={items}
            alignRight
            dropUp
            navbtn={false}
            className="pull-right"
            tooltip={gettext('Create new coverage')}
        />
    );
};

CoverageAddButton.propTypes = {
    onAdd: PropTypes.func,
    contentTypes: PropTypes.array,
};
