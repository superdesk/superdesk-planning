import * as React from 'react';

import {IBasePreviewProps} from './PreviewHoc';

import {PreviewFormItem} from './PreviewFormItem';


export class PreviewFormMultilingualText extends React.PureComponent<IBasePreviewProps> {
    render() {
        if (Object.keys(this.props.translations).length) {
            return Object.keys(this.props.translations).map((languageQcode) => (
                <PreviewFormItem
                    key={languageQcode}
                    {...this.props}
                    label={this.props.label + ` (${languageQcode})`}
                    value={this.props.translations[languageQcode]}
                />
            ));
        } else {
            return (
                <PreviewFormItem {...this.props} />
            );
        }
    }
}
