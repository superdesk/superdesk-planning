import * as React from 'react';
import {connect} from 'react-redux';

import {IEditorFieldProps, IPlanningAppState} from '../../../interfaces';

/**
 * Owned here rather than in ../editor so registration does not depend on module
 * evaluation order in the circular import between the two files; ../editor adds
 * its initial entries and re-exports it.
 */
export const FIELD_TO_EDITOR_COMPONENT: {[field: string]: React.ComponentType<any>} = {};

interface IEditorHocOptions<S extends IEditorFieldProps> {
    Component: React.ComponentType<S>;
    props?(currentProps: S): Partial<S>;
    mapStateToProps?: (state: IPlanningAppState) => Partial<S>;
    forwardRef?: boolean;
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

            if (options.forwardRef) {
                props.refNode = refNode;
            } else {
                props.ref = refNode;
            }

            return (
                <Component {...props} />
            );
        }
    }

    if (options.mapStateToProps != null) {
        return connect(options.mapStateToProps)(EditorHOC);
    }

    return EditorHOC;
}

export function registerEditorField<ComponentProps extends IEditorFieldProps, StateProps extends {}>(
    field: string,
    Component: React.ComponentType<ComponentProps>,
    props?: (currentProps: ComponentProps & StateProps) => Partial<ComponentProps & StateProps>,
    mapStateToProps?: (state: IPlanningAppState) => Partial<ComponentProps & StateProps>,
    forwardRef?: boolean
): void {
    FIELD_TO_EDITOR_COMPONENT[field] = editorHoc({
        Component,
        props,
        mapStateToProps,
        forwardRef,
    });
}
