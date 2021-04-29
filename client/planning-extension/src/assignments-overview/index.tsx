import {groupBy} from 'lodash';
import * as React from 'react';
import {
    IDesk,
    IResourceChange,
    IRestApiResponse,
    ISuperdeskQuery,
    IUser,
    IVocabulary,
    IVocabularyItem,
} from 'superdesk-api';
import {IAssignmentItem} from '../../../interfaces';
import {superdesk} from '../superdesk';
import {Badge} from 'superdesk-ui-framework';
import {AssignmentsOverviewListItem} from './assignments-overview-list-item';

const {addWebsocketMessageListener} = superdesk;

const DropdownTree = superdesk.components.getDropdownTree<IAssignmentItem>();
const {queryRawJson, findOne, fetchChangedResourcesObj} = superdesk.dataApi;
const {GroupLabel, IconBig, TopMenuDropdownButton, getLiveQueryHOC} = superdesk.components;
const {throttleAndCombineArray} = superdesk.utilities;
const LiveAssignmentsHOC = getLiveQueryHOC<IAssignmentItem>();

interface IProps {
    // empty
}

interface IState {
    loading: false;
    currentUser: IUser;
    desks: {[key: string]: IDesk}; // desks by _id
    contentTypes: Array<IVocabularyItem>;
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

function fetchDesks(): Promise<IState['desks']> {
    return queryRawJson<IRestApiResponse<IDesk>>('desks').then((desksResponse) => {
        const desks = desksResponse._items.reduce<{[key: string]: IDesk}>((acc, item) => {
            acc[item._id] = item;

            return acc;
        }, {});

        return desks;
    });
}

function fetchContentTypes(): Promise<IState['contentTypes']> {
    return findOne<IVocabulary>('vocabularies', 'g2_content_type').then(({items}) => (items));
}

export class AssignmentsList extends React.PureComponent<IProps, {loading: true} | IState> {
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;
    handleContentChangesThrottled: (changes: Array<IResourceChange>) => void;

    constructor(props: {}) {
        super(props);

        this.state = {loading: true};

        this.eventListenersToRemoveBeforeUnmounting = [];

        this.handleContentChanges = this.handleContentChanges.bind(this);

        this.handleContentChangesThrottled = throttleAndCombineArray(
            (changes: Array<IResourceChange>) => {
                this.handleContentChanges(changes);
            },
            300,
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketMessageListener(
                'resource:created',
                (event) => {
                    const {resource, _id} = event.detail.extra;

                    this.handleContentChangesThrottled([{changeType: 'created', resource: resource, itemId: _id}]);
                },
            ),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketMessageListener(
                'resource:updated',
                (event) => {
                    const {resource, _id, fields} = event.detail.extra;

                    this.handleContentChangesThrottled([{
                        changeType: 'updated',
                        resource: resource,
                        itemId: _id,
                        fields: fields,
                    }]);
                },
            ),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketMessageListener(
                'resource:deleted',
                (event) => {
                    const {resource, _id} = event.detail.extra;

                    this.handleContentChangesThrottled([{changeType: 'deleted', resource: resource, itemId: _id}]);
                },
            ),
        );
    }

    handleContentChanges(changes: Array<IResourceChange>) {
        const state = this.state;

        if (state.loading === true) {
            return;
        }

        const refetchContentTypes: boolean = changes.find(
            ({resource, itemId}) => resource === 'vocabularies' && itemId === 'g2_content_type',
        ) != null;

        Promise.all([
            fetchChangedResourcesObj<IDesk>('desks', changes, state.desks),
            refetchContentTypes ? fetchContentTypes() : Promise.resolve(state.contentTypes),
        ]).then(([desks, contentTypes]) => {
            this.setState({
                loading: false,
                desks: desks,
                contentTypes: contentTypes,
            });
        });
    }

    componentDidMount() {
        superdesk.session.getCurrentUser()
            .then((currentUser) =>
                Promise.all([
                    fetchDesks(),
                    fetchContentTypes(),
                ]).then(([desks, contentTypes]) => {
                    this.setState({
                        loading: false,
                        currentUser: currentUser,
                        desks: desks,
                        contentTypes: contentTypes,
                    });
                })
            );
    }

    componentWillUnmount() {
        this.eventListenersToRemoveBeforeUnmounting.forEach((removeListener) => {
            removeListener();
        });
    }

    render() {
        if (this.state.loading === true) {
            return null;
        }

        const {desks, contentTypes, currentUser} = this.state;

        return (
            <LiveAssignmentsHOC resource="assignments" query={getAssignmentsQuery(currentUser._id)}>
                {
                    (data) => {
                        const assignments = data._items;
                        const itemsCount = assignments.length;
                        const grouped = groupBy(assignments, (item) => item.assigned_to.desk);

                        superdesk.dispatchEvent(
                            'menuItemBadgeValueChange',
                            {menuId: 'MENU_ITEM_PLANNING_ASSIGNMENTS', badgeValue: data._meta.total.toString()},
                        );

                        return (
                            <DropdownTree
                                groups={Object.keys(grouped).map((deskId) => ({
                                    render: () => (
                                        <GroupLabel>
                                            <Badge type="highlight" text={grouped[deskId].length.toString()} />
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
                                                <span style={{color: isOpen ? 'var(--sd-slugline-color)' : 'var(--color-bg-00)'}}>
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
                    }
                }
            </LiveAssignmentsHOC>
        );
    }
}
