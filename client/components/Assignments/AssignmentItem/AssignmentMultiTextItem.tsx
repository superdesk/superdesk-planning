import React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {IAssignmentItemProps, AssignmentItem} from './index';
import {ArchiveItem} from '../../Archive';
import {NestedItem} from '../../UI/List';

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
        if ((this.props.assignment.linked_items?.length ?? 0) <= 1) {
            return (<AssignmentItem {...this.props} />);
        }

        const relatedItems = this.props.assignment.linked_items
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
