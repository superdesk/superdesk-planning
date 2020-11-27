import {AcceptedComponent} from './Accepted';
import {ContentComponent} from './Content';
import {DescriptionTextComponent} from './DescriptionText';
import {DeskComponent} from './Desk';
import {DueDateComponent} from './DueDate';
import {GenreComponent} from './Genre';
import {HeadlineComponent} from './Headline';
import {InternalComponent} from './Internal';
import {NameComponent} from './Name';
import {PriorityComponent} from './Priority';
import {SluglineComponent} from './Slugline';
import {StateComponent} from './State';
import {LanguageComponent} from './Language';
import {appConfig} from 'appConfig';

type AssignmentViewField =
    | 'accepted'
    | 'content'
    | 'description_text'
    | 'desk'
    | 'due_date'
    | 'genre'
    | 'headline'
    | 'internal'
    | 'name'
    | 'priority'
    | 'slugline'
    | 'state'
    | 'language';

// Returns the React component to render for the given 'field' of an assignment
export const getComponentForField = (field: AssignmentViewField) => {
    switch (field) {
    case 'accepted':
        return AcceptedComponent;
    case 'content':
        return ContentComponent;
    case 'description_text':
        return DescriptionTextComponent;
    case 'desk':
        return DeskComponent;
    case 'due_date':
        return DueDateComponent;
    case 'genre':
        return GenreComponent;
    case 'headline':
        return HeadlineComponent;
    case 'internal':
        return InternalComponent;
    case 'name':
        return NameComponent;
    case 'priority':
        return PriorityComponent;
    case 'slugline':
        return SluglineComponent;
    case 'state':
        return StateComponent;
    case 'language':
        return LanguageComponent;
    default:
        console.warn(
            `There's no component for assignment field '${field}'`
        );
        return null;
    }
};

const DEFAULT_ASSSIGNMENTS_LIST_VIEW: {
    firstLine: Array<AssignmentViewField>
    secondLine: Array<AssignmentViewField>
} = {
    firstLine: ['slugline', 'description_text'],
    secondLine: [
        'priority',
        'state',
        'accepted',
        'content',
        'internal',
        'due_date',
        'desk',
        'genre',
        'language',
    ],
};

// Get fields config for a single assignment view
export const getAssignmentsListView = () =>
    appConfig.assignmentsList || DEFAULT_ASSSIGNMENTS_LIST_VIEW;

// Returns true if assignments list view requrires archive items data
export const assignmentsViewRequiresArchiveItems = (): boolean => {
    const listViewConfig = getAssignmentsListView();
    const fields = [...listViewConfig.firstLine, ...listViewConfig.secondLine];

    return fields.includes('headline');
};
