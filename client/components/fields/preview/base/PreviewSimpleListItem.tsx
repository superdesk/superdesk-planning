import * as React from 'react';
import {IBasePreviewProps} from './PreviewHoc';
import {stringUtils} from '../../../../utils';
import {FormLabel, Text, ContentDivider} from 'superdesk-ui-framework/react';

interface IProps extends IBasePreviewProps {
    useFormLabelAndText?: boolean;
    addContentDivider?: boolean;
}

export class PreviewSimpleListItem extends React.PureComponent<IProps> {
    render() {
        if ((this.props.value?.length ?? 0) == 0 && this.props.renderEmpty !== true) {
            return null;
        }

        const children = this.props.children || (
            this.props.value?.length && this.props.convertNewlineToBreak ?
                stringUtils.convertNewlineToBreak(this.props.value) :
                this.props.value
        ) || this.props.defaultString || '-';

        return (
            <React.Fragment>
                {this.props.useFormLabelAndText ? (
                    <div>
                        <FormLabel text={this.props.label} />
                        <Text size="small" weight="medium">
                            {children}
                        </Text>
                    </div>
                ) : (
                    <li className="simple-list__item simple-list__item--flex">
                        <span className="simple-list__item-label">{this.props.label}</span>
                        <span className="simple-list__item-data">{children}</span>
                    </li>
                )}
                {this.props.addContentDivider !== true ? null : (
                    <ContentDivider type="dashed" margin="x-small" />
                )}
            </React.Fragment>
        );
    }
}
