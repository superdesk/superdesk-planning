import * as React from 'react';
import {connect} from 'react-redux';

import {IEditorFieldProps, IPlanningAppState} from '../../../interfaces';
import {FIELD_TO_EDITOR_COMPONENT} from '../editor';

interface IEditorHocOptions<S extends IEditorFieldProps> {
    Component: React.ComponentClass<S>;
    props?(currentProps: S): Partial<S>;
    mapStateToProps?: (state: IPlanningAppState) => Partial<S>;
}

function editorHoc<S extends IEditorFieldProps>(options: IEditorHocOptions<S>) {
    class EditorHOC extends React.PureComponent<S> {
        render() {
            const {Component} = options;
            const {
                refNode,
                ...currentProps
            } = this.props;
            const props = {
                ...(options.props == null ? {} : options.props(this.props)),
                ...currentProps,
            };

            return (
                <Component
                    ref={refNode}
                    {...props}
                />
            );
        }
    }

    if (options.mapStateToProps != null) {
        return connect(options.mapStateToProps)(EditorHOC);
    }

    return EditorHOC;
}

export function registerEditorField<S extends IEditorFieldProps>(
    field: string,
    Component: React.ComponentClass<S>,
    props?: (currentProps: S) => Partial<S>,
    mapStateToProps?: (state: IPlanningAppState) => Partial<S>
) {
    FIELD_TO_EDITOR_COMPONENT[field] = editorHoc({
        Component,
        props,
        mapStateToProps,
    });
}
