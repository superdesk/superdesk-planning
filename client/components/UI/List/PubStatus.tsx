import React from 'react';
import PropTypes from 'prop-types';
import {Tooltip} from 'superdesk-ui-framework/react';

import {TOOLTIPS} from '../../../constants';

import {Column} from './Column';
import {isNotForPublication} from '../utils';
import {superdeskApi} from '../../../superdeskApi';

/**
 * @ngdoc react
 * @name PubStatus
 * @description Component to show published status of an item
 */
export const PubStatus = ({item, isPublic}) => {
    let badge;
    let title = null;

    const {gettext} = superdeskApi.localization;

    if (isPublic) {
        title = TOOLTIPS.postedState;
        badge = <span className="badge badge--success">P</span>;
    } else if (isNotForPublication(item)) {
        title = TOOLTIPS.notForPublication;
        badge = (
            <i
                className="icon-ban-circle icon--red"
                style={{
                    width: '22px',
                    height: '22px',
                    fontSize: '22px',
                }}
            />
        );
    } else {
        title = gettext('Not posted');

        badge = <span className="badge badge--light">&nbsp;</span>;
    }

    return (
        <Column>
            {title && (
                <Tooltip content={title} placement="right">
                    {badge}
                </Tooltip>
            )}
            {!title && (badge)}
        </Column>
    );
};

PubStatus.propTypes = {
    item: PropTypes.object.isRequired,
    isPublic: PropTypes.bool,
};
