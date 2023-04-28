import * as React from 'react';
import {escape as escapeHtml} from 'lodash';

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
            if (this.props.schema?.type === 'string' && this.props.schema.field_type === 'editor_3') {
                const value = !(this.props.value?.length && this.props.value[0] !== '<') ?
                    this.props.value :
                    escapeHtml(this.props.value)
                        .split('\n')
                        .map((line) => `<p>${line || '<br>'}</p>`)
                        .join('');

                children = (
                    <div
                        className="html-preview"
                        dangerouslySetInnerHTML={{__html: value}}
                    />
                );
            } else {
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
        }

        return (
            <div className="form__row" data-test-id={this.props.testId}>
                {this.props.label == undefined ? null : (
                    <label className={labelClass}>
                        {this.props.label}:
                    </label>
                )}
                {children}
            </div>
        );
    }
}
