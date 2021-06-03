import * as React from 'react';
import {IVocabularyItem} from 'superdesk-api';
import {IAssignmentItem} from '../../../interfaces';
import {extensionBridge} from '../extension_bridge';
import {superdesk} from '../superdesk';

const {ListItem, ListItemColumn, ListItemRow} = superdesk.components;
const {getClass} = superdesk.utilities.CSS;
const {getAssignmentTypeInfo} = extensionBridge.assignments.utils;
const {SluglineComponent, DueDateComponent, StateComponent} = extensionBridge.assignments.components;

interface IProps {
    assignment: IAssignmentItem;
    contentTypes: Array<IVocabularyItem>;
    onClick(): void;
}

export class AssignmentsOverviewListItem extends React.PureComponent<IProps> {
    render() {
        const {assignment, contentTypes, onClick} = this.props;
        const {className, tooltip} = getAssignmentTypeInfo(assignment, contentTypes);

        return (
            <button
                className={getClass('assignments-overview--item')}
                onClick={() => {
                    onClick();
                    superdesk.browser.location.setPage(`/workspace/assignments?assignment=${assignment._id}`);
                }}
            >
                <ListItem fullWidth>
                    <ListItemColumn>
                        <i className={className} title={tooltip} />
                    </ListItemColumn>

                    <ListItemColumn grow noPadding>
                        <ListItemRow>
                            <ListItemColumn grow>
                                <SluglineComponent assignment={assignment} />
                            </ListItemColumn>
                        </ListItemRow>

                        <ListItemRow>
                            <ListItemColumn noBorder grow>
                                <StateComponent assignment={assignment} />
                            </ListItemColumn>

                            <ListItemColumn>
                                <DueDateComponent assignment={assignment} />
                            </ListItemColumn>
                        </ListItemRow>
                    </ListItemColumn>
                </ListItem>
            </button>
        );
    }
}