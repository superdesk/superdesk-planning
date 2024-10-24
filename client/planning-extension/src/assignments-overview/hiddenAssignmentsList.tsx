import * as React from 'react';
import {ISuperdeskQuery, IUser} from 'superdesk-api';
import {IAssignmentItem} from '../../../interfaces';
import {superdesk} from '../superdesk';
const {getLiveQueryHOC} = superdesk.components;
const LiveAssignmentsHOC = getLiveQueryHOC<IAssignmentItem>();

interface IState {
    loading: false;
    currentUser: IUser;
}

function getAssignmentsQuery(userId: IUser['_id']): ISuperdeskQuery {
    const query: ISuperdeskQuery = {
        filter: {
            $and: [
                {'assigned_to.user': {$eq: userId}},
                {'assigned_to.state': {$in: ['assigned']}},
            ],
        },
        sort: [{'planning.scheduled': 'asc'}],
        page: 1,
        max_results: 100,
    };

    return query;
}

export class HiddenAssignmentsList extends React.PureComponent<{}, {loading: true} | IState> {
    constructor(props: {}) {
        super(props);

        this.state = {loading: true};
    }

    componentDidMount() {
        superdesk.session.getCurrentUser()
            .then((currentUser) => {
                this.setState({
                    loading: false,
                    currentUser: currentUser,
                });
            });
    }

    render() {
        if (this.state.loading === true) {
            return null;
        }

        const {currentUser} = this.state;

        return (
                <LiveAssignmentsHOC resource="assignments" query={getAssignmentsQuery(currentUser._id)}>
                    {
                        (data) => {
                            const itemsCount = data._meta.total;

                            superdesk.dispatchEvent(
                                'menuItemBadgeValueChange',
                                {menuId: 'MENU_ITEM_PLANNING_ASSIGNMENTS', badgeValue: itemsCount.toString()},
                            );

                            return null;
                        }
                    }
                </LiveAssignmentsHOC>
        );
    }
}
