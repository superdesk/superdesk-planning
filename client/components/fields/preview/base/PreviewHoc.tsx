import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {IListFieldProps} from '../../../../interfaces';

export interface IBasePreviewProps {
    label?: string;
    value?: string;
    testId?: string;
    renderEmpty?: boolean;
    defaultString?: string;

    // These next two are only used in PreviewFormItem
    light?: boolean;
    style?: 'normal' | 'strong' | 'light' | 'italic' | 'serif' | 'slugline'; // defaults to normal
    convertNewlineToBreak?: boolean;
    expandable?: boolean;
}

export interface IPreviewHocOptions<S = {}> {
    props?(): IBasePreviewProps;
    getValue(value: any | undefined, props: S): string | undefined;
    mapStateToProps?: (state: any) => S;
}

export function previewHoc<S = {}>(
    options: IPreviewHocOptions<S>,
    Component: React.ComponentType<IBasePreviewProps>,
    fieldName: string,
) {
    class HOC extends React.PureComponent<IListFieldProps & S> {
        render() {
            const field = this.props.field ?? fieldName;
            const value = options.getValue(
                get(this.props.item, field),
                this.props,
            );

            const props = options.props == undefined ? {} : options.props();

            return (
                <Component
                    value={value}
                    light={true}
                    {...props}
                    {...this.props}
                />
            );
        }
    }

    if (options.mapStateToProps != undefined) {
        return connect(options.mapStateToProps)(HOC);
    }

    return HOC;
}
