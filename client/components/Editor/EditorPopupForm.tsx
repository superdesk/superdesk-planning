import * as React from 'react';
import {connect} from 'react-redux';
import classNames from 'classnames';

import {EDITOR_TYPE, IPlanningAppState} from '../../interfaces';

import {editorSelectors} from '../../selectors/editors';

import './style.scss';

interface IProps {
    editorType: EDITOR_TYPE;
    component?: React.ComponentClass;
    props?: any;
}

const mapStateToProps = (state: IPlanningAppState, props: IProps) => ({
    component: editorSelectors[props.editorType].getPopupFormComponent(state),
    props: editorSelectors[props.editorType].getPopupFormProps(state),
});

class EditorPopupFormComponent extends React.PureComponent<IProps> {
    render() {
        const Form = this.props.component;
        const props = this.props.props;

        return (
            <div
                className={classNames(
                    'editor-popup-form',
                    {'editor-popup-form--open': Form != null}
                )}
            >
                <div className="editor-popup-form__backdrop" />
                {Form == null ? null : (
                    <div
                        className="editor-popup-form__container"
                        data-test-id="editor-popup-form"
                    >
                        <Form {...props} />
                    </div>
                )}
            </div>
        );
    }
}

export const EditorPopupForm = connect(mapStateToProps)(EditorPopupFormComponent);
