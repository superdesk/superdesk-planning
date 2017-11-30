import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {OrderBar} from '../index';

export class AssignmentListSearchHeader extends React.Component {
    changeFilterBy(filterBy) {
        const {orderByField, orderDirection, changeFilter} = this.props;

        changeFilter(filterBy, orderByField, orderDirection);
    }

    changeOrder(orderByField, orderDirection) {
        const {filterBy, changeFilter} = this.props;

        changeFilter(filterBy, orderByField, orderDirection);
    }

    render() {
        const fields = ['Created', 'Updated', 'Priority'];
        const {
            filterBy,
            myAssignmentsCount,
            orderByField,
            orderDirection,
        } = this.props;

        return (
            <div className="Assignments-list-container__search subnav">
                <button type="button" onClick={() => this.changeFilterBy('All')}
                    className={
                        classNames('btn', {
                            'btn--primary btn--small': filterBy === 'All',
                            'btn--hollow btn--small': filterBy !== 'All',
                        })
                    }
                >All</button>
                <div className="element-with-badge">
                    <button type="button" onClick={() => this.changeFilterBy('User')}
                        className={
                            classNames('btn', {
                                'btn--primary btn--small': filterBy === 'User',
                                'btn--hollow btn--small': filterBy !== 'User',
                            })
                        }
                    >Assigned To Me</button>
                    <span className="badge badge--highlight">{myAssignmentsCount}</span>
                </div>
                <div className="subnav__stretch-bar" />
                <OrderBar
                    orderByField={orderByField}
                    orderDirection={orderDirection}
                    fields={fields}
                    onChange={(orderByField, orderDirection) => this.changeOrder(orderByField, orderDirection)}
                />
            </div>
        );
    }
}

AssignmentListSearchHeader.propTypes = {
    filterBy: PropTypes.string,
    myAssignmentsCount: PropTypes.number,
    orderByField: PropTypes.string,
    orderDirection: PropTypes.string,
    changeFilter: PropTypes.func.isRequired,
};

AssignmentListSearchHeader.defaultProps = {
    filterBy: 'All',
    myAssignmentsCount: 0,
    orderByField: 'Updated',
    orderDirection: 'Asc',
};
