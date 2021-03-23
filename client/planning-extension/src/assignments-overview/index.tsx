import {groupBy} from 'lodash';
import * as React from 'react';
import {IDesk, IRestApiResponse, IVocabulary, IVocabularyItem} from 'superdesk-api';
import {IAssignmentItem} from '../../../interfaces';
import {superdesk} from '../superdesk';
import {Badge} from 'superdesk-ui-framework';
import {AssignmentsOverviewListItem} from './assignments-overview-list-item';

const DropdownTree = superdesk.components.getDropdownTree<IAssignmentItem>();
const {queryRawJson, findOne} = superdesk.dataApi;
const {GroupLabel, IconBig, TopMenuDropdownButton} = superdesk.components;

interface IState {
    loading: false;
    desks: {[key: string]: IDesk}; // desks by _id
    contentTypes: Array<IVocabularyItem>;
    items: Array<IAssignmentItem>;
}

export class AssignmentsList extends React.PureComponent<{}, {loading: true} | IState> {
    constructor(props: {}) {
        super(props);

        this.state = {loading: true};
    }

    componentDidMount() {
        const getDesks = () => queryRawJson<IRestApiResponse<IDesk>>('desks');
        const getContentTypes = () => findOne<IVocabulary>('vocabularies', 'g2_content_type');
        const getCurrentUser = () => superdesk.session.getCurrentUser();

        Promise.all([
            getCurrentUser(),
            getDesks(),
            getContentTypes(),
        ])
            .then(([currentUser, desksResponse, contentTypes]) =>
                queryRawJson<IRestApiResponse<IAssignmentItem>>(
                    'assignments',
                    {
                        page: '1',
                        sort: '[("planning.scheduled", 1)]',
                        source: JSON.stringify({
                            query: {
                                bool: {
                                    must: [
                                        {term: {'assigned_to.user': currentUser._id}},
                                        {terms: {'assigned_to.state': ['in_progress', 'submitted']}},
                                    ],
                                },
                            },
                        }),
                    },
                ).then((response) => {
                    this.setState({
                        loading: false,
                        desks: desksResponse._items.reduce<{[key: string]: IDesk}>((acc, item) => {
                            acc[item._id] = item;

                            return acc;
                        }, {}),
                        contentTypes: contentTypes.items,
                        items: response._items
                    });
                }),
            );
    }

    render() {
        if (this.state.loading === true) {
            return null;
        }

        const {items, desks, contentTypes} = this.state;
        const itemsCount = items.length;
        const grouped = groupBy(items, (item) => item.assigned_to.desk);

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
