import React from 'react';
import PropTypes from 'prop-types';

import {Column} from './Column';
import {isItemPublic} from '../../../utils';

export const PubStatus = ({item}) => (
    <Column>
        {isItemPublic(item) ?
            <span className="badge badge--success">P</span> :
            <span className="badge badge--light">&nbsp;</span>
        }
    </Column>
);

PubStatus.propTypes = {
    item: PropTypes.object.isRequired
};
