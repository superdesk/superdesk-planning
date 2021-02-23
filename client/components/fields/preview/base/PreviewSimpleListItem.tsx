import * as React from 'react';
import {IBasePreviewProps} from './PreviewHoc';
import {stringUtils} from '../../../../utils';

export class PreviewSimpleListItem extends React.PureComponent<IBasePreviewProps> {
    render() {
        if (this.props.value == undefined && !this.props.renderEmpty) {
            return null;
        }

        const children = this.props.children || (
            this.props.value?.length && this.props.convertNewlineToBreak ?
                stringUtils.convertNewlineToBreak(this.props.value) :
                this.props.value
        ) || this.props.defaultString || '-';

        return (
            <li className="simple-list__item simple-list__item--flex">
                <span className="simple-list__item-label">{this.props.label}</span>
                <span className="simple-list__item-data">{children}</span>
            </li>
        );
    }
}
