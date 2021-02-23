import * as React from 'react';
import {IBasePreviewProps} from './PreviewHoc';
import {stringUtils} from '../../../../utils';
import {ExpandableText} from '../../../UI/Preview';

export class PreviewFormItem extends React.PureComponent<IBasePreviewProps> {
    render() {
        if (this.props.value == undefined && !this.props.renderEmpty) {
            return null;
        }

        const labelClass = !this.props.light ?
            'form-label' :
            'form-label form-label--light';
        const textClass = `sd-text__${this.props.style ?? 'normal'}`;
        let children = this.props.children;

        if (!children) {
            const value = (
                this.props.value?.length && this.props.convertNewlineToBreak ?
                    stringUtils.convertNewlineToBreak(this.props.value) :
                    this.props.value
            ) || this.props.defaultString || '-';

            children = !this.props.expandable ? (
                <p className={textClass}>
                    {value}
                </p>
            ) : (
                <ExpandableText
                    value={value}
                />
            );
        }

        return (
            <div className="form__row" data-test-id={this.props.testId}>
                {this.props.label == undefined ? null : (
                    <label className={labelClass}>
                        {this.props.label}
                    </label>
                )}
                {children}
            </div>
        );
    }
}
