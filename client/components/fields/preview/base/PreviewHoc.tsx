import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {IListFieldProps, IProfileSchemaType} from '../../../../interfaces';
import {planningApi} from '../../../../superdeskApi';

export interface IBasePreviewProps {
    label?: string;
    value?: string;
    translations?: {[language: string]: string};
    testId?: string;
    renderEmpty?: boolean;
    defaultString?: string;

    // These next two are only used in PreviewFormItem
    light?: boolean;
    style?: 'normal' | 'strong' | 'light' | 'italic' | 'serif' | 'slugline'; // defaults to normal
    convertNewlineToBreak?: boolean;
    expandable?: boolean;
    schema?: IProfileSchemaType;
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
            let translations = {};

            if (this.props.profile?.name != null) {
                const multilingual = planningApi.contentProfiles.multilingual.getConfig(this.props.profile?.name);

                translations = (!multilingual.isEnabled || !multilingual.fields.includes(field)) ?
                    {} :
                    (this.props.item.translations ?? [])
                        .filter((entry) => (entry.field === field && multilingual.languages.includes(entry.language)))
                        .reduce((fields, entry) => {
                            fields[entry.language] = entry.value;

                            return fields;
                        }, {});
            }

            const props = options.props == undefined ? {} : options.props();

            return (
                <Component
                    value={value}
                    light={true}
                    {...props}
                    {...this.props}
                    schema={this.props.schema?.[field]}
                    translations={translations}
                />
            );
        }
    }

    if (options.mapStateToProps != undefined) {
        return connect(options.mapStateToProps)(HOC);
    }

    return HOC;
}
