import React from 'react';
import {EditorFieldEventRelatedPlanningsComponent} from './EventRelatedPlannings';
import {IEditorFieldProps, ILockedItems, IProfileSchemaTypeList, ISearchProfile} from 'interfaces';
import * as selectors from '../../../../selectors';
import {connect} from 'react-redux';

interface IOwnProps extends IEditorFieldProps {
    item: IEventItem;
    schema?: IProfileSchemaTypeList;
    coverageProfile?: ISearchProfile;
    addPlanningItem(item?: IPlanningItem): Promise<Partial<IPlanningItem>>;
    unlinkPlanning(item: DeepPartial<IPlanningItem>): Promise<void>;
    updatePlanningItem(
        original: DeepPartial<IPlanningItem>,
        updates: DeepPartial<IPlanningItem>,
        scrollOnChange: boolean,
    ): Promise<void>;
}

interface IReduxProps {
    lockedItems: ILockedItems;
}

export type IRelatedPlanningProps = IOwnProps & IReduxProps;

class EventRelatedPlanningWrapper extends React.PureComponent<IRelatedPlanningProps> {
    render() {
        const {refNode, ...props} = this.props;

        return (
            <EditorFieldEventRelatedPlanningsComponent
                ref={refNode}
                {...props}
            />
        );
    }
}

const mapStateToProps = (state): IReduxProps => ({
    lockedItems: selectors.locks.getLockedItems(state),
});

export const EditorFieldEventRelatedPlannings = connect(
    mapStateToProps,
)(EventRelatedPlanningWrapper);
