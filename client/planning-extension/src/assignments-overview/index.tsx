import {groupBy, keyBy} from 'lodash';
import * as React from 'react';
import {
    IDesk,
    ILiveResourcesProps,
    IRestApiResponse,
    ISuperdeskQuery,
    IUser,
    IVocabulary,
} from 'superdesk-api';
import {IAssignmentItem} from '../../../interfaces';
import {superdesk} from '../superdesk';
import {Badge} from 'superdesk-ui-framework';
import {AssignmentsOverviewListItem} from './assignments-overview-list-item';

const DropdownTree = superdesk.components.getDropdownTree<IAssignmentItem>();
const {GroupLabel, IconBig, TopMenuDropdownButton, getLiveQueryHOC, WithLiveResources} = superdesk.components;
const LiveAssignmentsHOC = getLiveQueryHOC<IAssignmentItem>();

interface IProps {
    // empty
}

interface IState {
    loading: false;
    currentUser: IUser;
}

function getAssignmentsQuery(userId: IUser['_id']): ISuperdeskQuery {
    const query: ISuperdeskQuery = {
        filter: {
            $and: [
                {'assigned_to.user': {$eq: userId}},
                {'assigned_to.state': {$in: ['assigned', 'submitted', 'in_progress']}},
            ],
        },
        sort: [{'planning.scheduled': 'asc'}],
        page: 0,
        max_results: 100,
    };

    return query;
}

export class AssignmentsList extends React.PureComponent<IProps, {loading: true} | IState> {
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
                        const assignments = data._items;
                        const itemsCount = data._meta.total;
                        const grouped = groupBy(assignments, (item) => item.assigned_to.desk);

                        superdesk.dispatchEvent(
                            'menuItemBadgeValueChange',
                            {menuId: 'MENU_ITEM_PLANNING_ASSIGNMENTS', badgeValue: itemsCount.toString()},
                        );

                        const resources: ILiveResourcesProps['resources'] = [
                            {resource: 'desks', ids: Object.keys(grouped)},
                            {resource: 'vocabularies', ids: ['g2_content_type']},
                        ];

                        return (
                            <WithLiveResources resources={resources}>
                                {(resourcesResponse) => {
                                    const desksResponse = resourcesResponse[0] as IRestApiResponse<IDesk>;
                                    const desks = keyBy(desksResponse._items, ({_id}) => _id);
                                    const vocabulariesResponse = resourcesResponse[1] as IRestApiResponse<IVocabulary>;
                                    const contentTypes = vocabulariesResponse._items[0].items;

                                    return (
                                        <DropdownTree
                                            groups={Object.keys(grouped).map((deskId) => ({
                                                render: () => (
                                                    <GroupLabel>
                                                        <Badge
                                                            type="highlight"
                                                            text={grouped[deskId].length.toString()}
                                                        />
                                                        <span className="sd-margin-l--1">{desks[deskId].name}</span>
                                                    </GroupLabel>
                                                ),
                                                items: grouped[deskId],
                                            }))}
                                            getToggleElement={
                                                (isOpen, onClick) => (
                                                    <TopMenuDropdownButton
                                                        onClick={() => {
                                                            if (itemsCount > 0) {
                                                                onClick();
                                                            }
                                                        }}
                                                        active={isOpen}
                                                        disabled={itemsCount < 1}
                                                        pulsate={false}
                                                        data-test-id="toggle-button"
                                                    >
                                                        <Badge type="highlight" text={itemsCount.toString()}>
                                                            <span
                                                                style={{
                                                                    color: isOpen
                                                                        ? 'var(--sd-slugline-color)'
                                                                        : 'var(--color-bg-00)'
                                                                }}
                                                            >
                                                                <IconBig name="tasks" />
                                                            </span>
                                                        </Badge>
                                                    </TopMenuDropdownButton>
                                                )
                                            }
                                            renderItem={(key, assignment, closeDropdown) => (
                                                <AssignmentsOverviewListItem
                                                    key={key}
                                                    assignment={assignment}
                                                    contentTypes={contentTypes}
                                                    onClick={closeDropdown}
                                                />
                                            )}
                                            wrapperStyles={{whiteSpace: 'nowrap', padding: 16, paddingTop: 0}}
                                        />
                                    );
                                }}
                            </WithLiveResources>
                        );
                    }
                }
            </LiveAssignmentsHOC>
        );
    }
}
