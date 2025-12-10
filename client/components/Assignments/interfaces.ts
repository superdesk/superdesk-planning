import {IAssignmentItem} from 'interfaces';

export interface IAssignmentListItemField {
    assignment: IAssignmentItem;

    fieldsProps: {
        // field specific props may be passed
        [key: string]: any;
    };

    fieldOptions: ILineConfig['fieldOptions'];
}
