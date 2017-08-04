import React from 'react'
import PropTypes from 'prop-types'
import { ListItem, Checkbox, UserAvatar, AbsoluteDate } from '../index'
import classNames from 'classnames'
import moment from 'moment'
import { getCoverageIcon } from '../../utils/index'

export const AssignmentItem = ({
        assignment,
        onClick,
        onDoubleClick,
        isSelected,
        onSelectChange,
        className,
        assignedUser,
        isCurrentUser,
    }) => {
    return (
        <ListItem
            item={assignment}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            draggable={true}
            className={classNames('assignment', className)}
            active={isSelected}
        >
            <div className="sd-list-item__action-menu">
                <Checkbox value={isSelected} onChange={({ target }) => {onSelectChange(target.value)}}/>
            </div>
            <div className="sd-list-item__column">
                <i className={getCoverageIcon(assignment.planning.g2_content_type)} />
            </div>
            <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border">
                <div className="sd-list-item__row">
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow assignment__title">
                        {assignment.planning.slugline && (
                            <span className="ListItem__slugline">{assignment.planning.slugline}</span>
                        )}
                        <span className="ListItem__headline">{assignment.planning.headline}</span>
                    </span>
                </div>
                <div className="sd-list-item__row">
                    <span className="ListItem__headline">
                            <i className="icon-time"/>
                            {assignment.planning.scheduled ? (
                                <AbsoluteDate date={assignment.planning.scheduled} />
                            ) : (<time><span>'not scheduled yet'</span></time>)}
                    </span>
                </div>
            </div>
            <div className="sd-list-item__column sd-list-item__column--no-border">
                <span className="ListItem__headline">
                    {moment(assignment._updated).fromNow()}
                </span>
            </div>
            <div className="sd-list-item__column sd-list-item__column--no-border">
                <span className="ListItem__headline">
                    <UserAvatar
                        user={assignedUser || { display_name: '*' }}
                        large={false}
                        withLoggedInfo={isCurrentUser}
                        isLoggedIn={isCurrentUser}
                    />
                </span>
            </div>
        </ListItem>
    )
}

AssignmentItem.propTypes = {
    assignment: PropTypes.object.isRequired,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
    className: PropTypes.string,
    assignedUser: PropTypes.object,
    isCurrentUser: PropTypes.bool,
    isSelected: PropTypes.bool,
    onSelectChange: PropTypes.func,
}
