import {groupBy} from 'lodash';
import * as React from 'react';
import {
    IDesk,
    IRestApiResponse,
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
const {queryRawJson, findOne} = superdesk.dataApi;
const {GroupLabel, IconBig, TopMenuDropdownButton} = superdesk.components;

interface IState {
    loading: false;
    currentUser: IUser;
    desks: {[key: string]: IDesk}; // desks by _id
    contentTypes: Array<IVocabularyItem>;
    assignments: Array<IAssignmentItem>;
}

interface IResourceChange {
    changeType: 'created' | 'updated' | 'deleted';
    resource: string;
    itemId: string;
    fields?: {[key: string]: 1};
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

function fetchAssignments(userId: IUser['_id']): Promise<IState['assignments']> {
    return queryRawJson<IRestApiResponse<IAssignmentItem>>(
        'assignments',
        {
            page: '1',
            sort: '[("planning.scheduled", 1)]',
            source: JSON.stringify({
                query: {
                    bool: {
                        must: [
                            {term: {'assigned_to.user': userId}},
                            {terms: {'assigned_to.state': ['assigned', 'submitted', 'in_progress']}},
                        ],
                    },
                },
            }),
        },
    ).then(({_items}) => {
        superdesk.dispatchEvent(
            'menuItemBadgeValueChange',
            {menuId: 'MENU_ITEM_PLANNING_ASSIGNMENTS', badgeValue: _items.length.toString()},
        );

        return _items;
    });
}

export class AssignmentsList extends React.PureComponent<{}, {loading: true} | IState> {
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;

    constructor(props: {}) {
        super(props);

        this.state = {loading: true};

        this.eventListenersToRemoveBeforeUnmounting = [];

        this.handleContentChanges = this.handleContentChanges.bind(this);

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketMessageListener(
                'resource:created',
                (event) => {
                    const {resource, _id} = event.detail.extra;

                    this.handleContentChanges([{changeType: 'created', resource: resource, itemId: _id}]);
                },
            ),
        );

        this.eventListenersToRemoveBeforeUnmounting.push(
            addWebsocketMessageListener(
                'resource:updated',
                (event) => {
                    const {resource, _id, fields} = event.detail.extra;

                    this.handleContentChanges([{
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

                    this.handleContentChanges([{changeType: 'deleted', resource: resource, itemId: _id}]);
                },
            ),
        );
    }

    handleContentChanges(changes: Array<IResourceChange>) {
        const state = this.state;

        if (state.loading === true) {
            return;
        }

        const {assignments} = state;

        const refetchDesks = changes.find(({resource}) => resource === 'desks');
        const refetchContentTypes = changes.find(
            ({resource, itemId}) => resource === 'vocabularies' && itemId === 'g2_content_type',
        );
        const refetchAssignments = changes.find(
            ({changeType, resource, itemId}) =>
                (resource === 'assignments' && (changeType === 'created' || changeType === 'deleted'))
                || (
                    resource === 'assignments'
                    && changeType === 'updated'
                    && assignments.find(({_id}) => _id === itemId) != null
                ),
        );

        Promise.all([
            refetchDesks ? fetchDesks() : Promise.resolve(state.desks),
            refetchContentTypes ? fetchContentTypes() : Promise.resolve(state.contentTypes),
            refetchAssignments ? fetchAssignments(state.currentUser._id) : Promise.resolve(state.assignments),
        ]).then(([desks, contentTypes, assignments]) => {
            this.setState({
                loading: false,
                desks: desks,
                contentTypes: contentTypes,
                assignments: assignments,
            });
        });
    }

    componentDidMount() {
        superdesk.session.getCurrentUser()
            .then((currentUser) =>
                Promise.all([
                    fetchDesks(),
                    fetchContentTypes(),
                    fetchAssignments(currentUser._id),
                ]).then(([desks, contentTypes, assignments]) => {
                    this.setState({
                        loading: false,
                        currentUser: currentUser,
                        desks: desks,
                        contentTypes: contentTypes,
                        assignments: assignments,
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

        const {assignments, desks, contentTypes} = this.state;
        const itemsCount = assignments.length;
        const grouped = groupBy(assignments, (item) => item.assigned_to.desk);

        return (
            <DropdownTree
                groups={Object.keys(grouped).map((deskId) => ({
                    render: () => (
                        <GroupLabel>
                            <Badge type="highlight" text={grouped[deskId].length.toString()} />
                            <span style={{marginLeft: 6}}>{desks[deskId].name}</span>
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
                                <span style={{color: isOpen ? '#3783A2' : 'white'}}>
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
                wrapperStyles={{whiteSpace: 'nowrap', padding: 15, paddingTop: 0}}
            />
        );
    }
}
