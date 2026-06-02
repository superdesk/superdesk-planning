import React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {IAssignmentItemProps, AssignmentItem} from './index';
import {ArchiveItem} from '../../Archive';
import {NestedItem} from '../../../components/UI/List/NestedItem';

interface IState {
    expanded: boolean;
}

export class AssignmentMultiTextItem extends React.Component<IAssignmentItemProps, IState> {
    constructor(props: IAssignmentItemProps) {
        super(props);

        this.state = {expanded: false};
        this.toggleVisibility = this.toggleVisibility.bind(this);
    }

    private toggleVisibility() {
        this.setState({expanded: !this.state.expanded});
    }

    render() {
        const isMultiContent = this.props.assignment.planning.multiple_content === true;
        const linkedItems = this.props.assignment.linked_items ?? [];

        if (linkedItems.length <= 1 && isMultiContent === false) {
            return (<AssignmentItem {...this.props} />);
        }

        const relatedItems = linkedItems
            .map((itemLink) => (this.props.archiveItems[itemLink._id]))
            .filter((item) => (item != null));

        return (
            <NestedItem
                parentItem={(
                    <AssignmentItem
                        {...this.props}
                        relatedUI={{
                            visible: this.state.expanded,
                            toggleVisibility: this.toggleVisibility,
                        }}
                    />
                )}
                expanded={this.state.expanded}
                marginBottom={this.state.expanded}
                nestedChildren={this.state.expanded !== true ? null :
                    relatedItems.map((item) => (
                        <ArchiveItem
                            key={item._id}
                            item={item}
                            use2Lines={false}
                            onClick={() => this.props.onDoubleClickArchiveItem(item)}
                            onDoubleClick={() => superdeskApi.ui.article.edit(item._id)}
                        />
                    ))
                }
            />
        );
    }
}
