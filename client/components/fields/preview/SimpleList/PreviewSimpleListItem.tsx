import * as React from 'react';

interface IProps {
    label: string;
    data: string;
}

export class PreviewSimpleListItem extends React.PureComponent<IProps> {
    render() {
        return (
            <li className="simple-list__item simple-list__item--flex">
                <span className="simple-list__item-label">{this.props.label}</span>
                <span className="simple-list__item-data">{this.props.data}</span>
            </li>
        );
    }
}
