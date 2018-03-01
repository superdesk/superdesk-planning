import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import moment from 'moment-timezone';
import {get} from 'lodash';
import {planningUtils, getCreator} from '../../utils';
import {UserAvatar, AbsoluteDate, ItemActionsMenu} from '../../components';

export const CoverageListItem = ({
    coverage,
    users,
    desks,
    onClick,
    actions,
    readOnly,
}) => {
    const userAssigned = getCreator(coverage, 'assigned_to.user', users);
    const deskAssigned = desks.find((d) =>
        d._id === get(coverage, 'assigned_to.desk'));
    const coverageDate = get(coverage, 'planning.scheduled');
    const classes = classNames(
        planningUtils.getCoverageIcon(get(coverage, 'planning.g2_content_type')),
        {
            'icon--green': coverageDate && moment(coverageDate).isAfter(moment()),
            'icon--red': coverageDate && !moment(coverageDate).isAfter(moment()),
        }
    );

    return (
        <div className="ListItem sd-list-item sd-shadow--z2" onClick={onClick}>
            <div className="sd-list-item__border"/>
            <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border">
                <div className="sd-list-item__row">
                    <i className={classes}/>&nbsp;&nbsp;
                    {!userAssigned && !deskAssigned && <span>Not assigned</span>}
                    {userAssigned && <UserAvatar user={userAssigned}/>}
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {deskAssigned && 'Desk:' + get(deskAssigned, 'name')}
                    </span>
                    <i className="icon-time"/>
                    {coverageDate ?
                        <AbsoluteDate date={coverageDate.toString()} /> :
                        <time><span>Not scheduled yet</span></time>
                    }
                </div>
            </div>
            <div className="sd-list-item__action-menu">
                {!readOnly && Array.isArray(actions) &&
                actions.length > 0 && <ItemActionsMenu actions={actions}/>}
            </div>
        </div>
    );
};

CoverageListItem.propTypes = {
    coverage: PropTypes.object.isRequired,
    users: PropTypes.array.isRequired,
    desks: PropTypes.array,
    onClick: PropTypes.func.isRequired,
    actions: PropTypes.array,
    readOnly: PropTypes.bool.isRequired,
};
