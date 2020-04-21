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

export const getComponentForField = (field: string) => {
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
    }
};

export const DEFAULT_ASSSIGNMENTS_LIST_VIEW = {
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
    ],
};
