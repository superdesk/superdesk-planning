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
import {ILineConfig} from 'globals';
import {IAssignmentListItemField} from '../../../../components/Assignments/interfaces';
import {VocabularyComponent} from './Vocabulary';

export type AssignmentViewField =
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
    | 'language'
    | 'vocabulary';

// Returns the React component to render for the given 'field' of an assignment
export const getComponentForField = (field: AssignmentViewField): React.ComponentType<IAssignmentListItemField> => {
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
    case 'vocabulary':
        return VocabularyComponent;
    default:
        console.warn(
            `There's no component for assignment field '${field}'`
        );
        return null;
    }
};

const DEFAULT_ASSIGNMENTS_LIST_VIEW: {
    firstLine: Array<ILineConfig>
    secondLine: Array<ILineConfig>
} = {
    firstLine: [
        {fieldId: 'slugline'},
        {fieldId: 'description_text'},
    ],
    secondLine: [
        {fieldId: 'priority'},
        {fieldId: 'state'},
        {fieldId: 'accepted'},
        {fieldId: 'content'},
        {fieldId: 'internal'},
        {fieldId: 'due_date'},
        {fieldId: 'desk'},
        {fieldId: 'genre'},
        {fieldId: 'language'},
    ],
};

const getOldConfigFormat = (): {
    firstLine: Array<ILineConfig>
    secondLine: Array<ILineConfig>
} => {
    if (appConfig.assignmentsList == null) {
        return undefined;
    }

    return {
        firstLine: appConfig.assignmentsList.firstLine.map((fieldId: string) => ({fieldId})),
        secondLine: appConfig.assignmentsList.secondLine.map((fieldId: string) => ({fieldId}))
    };
};

// Get fields config for a single assignment view
export const getAssignmentsListView = (): {
    firstLine: Array<ILineConfig>
    secondLine: Array<ILineConfig>
} => appConfig.planning?.assignment_list_item ?? getOldConfigFormat() ?? DEFAULT_ASSIGNMENTS_LIST_VIEW;
