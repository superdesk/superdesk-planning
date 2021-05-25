import * as React from 'react';

import {
    ISearchProfile,
    IEditorRefComponent,
    IEditorAPI,
    EDITOR_TYPE,
    IEditorFormGroup,
    IProfileSchema,
} from '../../interfaces';
import {planningApi} from '../../superdeskApi';

import {renderFieldsForPanel} from '../fields';
import {ToggleBox} from '../UI';

interface IProps {
    group: IEditorFormGroup;
    defaultGroup: IEditorFormGroup['id'];
    schema: IProfileSchema;
    globalProps: {[key: string]: any};
    fieldProps: {[key: string]: any};
    editorType: EDITOR_TYPE;
}

export class EditorGroup extends React.PureComponent<IProps> implements IEditorRefComponent {
    dom: {
        div: React.RefObject<HTMLDivElement>;
        toggle: React.RefObject<ToggleBox>;
    };
    editorApi: IEditorAPI;

    constructor(props) {
        super(props);

        this.editorApi = planningApi.editor(this.props.editorType);
        this.dom = {
            div: React.createRef<HTMLDivElement>(),
            toggle: React.createRef<ToggleBox>(),
        };

        this.focus = this.focus.bind(this);
    }

    componentDidMount() {
        if (this.props.group.id === this.props.defaultGroup) {
            this.focus();
        }
    }

    scrollIntoView() {
        if (this.dom.div.current != null) {
            this.dom.div.current.scrollIntoView({behavior: 'smooth'});
        } else if (this.dom.toggle.current != null) {
            if (!this.dom.toggle.current.state.isOpen) {
                this.dom.toggle.current.toggle();
            } else {
                this.dom.toggle.current.scrollInView();
            }
        }

        // Wait for scroll to complete, then attempt to focus the first field
        this.editorApi.form
            .waitForScroll()
            .then(this.focus);
    }

    getBoundingClientRect() {
        if (this.dom.div.current != null) {
            return this.dom.div.current.getBoundingClientRect();
        } else if (this.dom.toggle.current != null) {
            return this.dom.toggle.current.getBoundingClientRect();
        }
    }

    getFirstFocusableField(): IEditorRefComponent | null {
        let field: string;

        for (field of this.props.group.fields) {
            if (field &&
                this.editorApi.dom.fields[field]?.current != null &&
                this.editorApi.dom.fields[field].current.focus != null
            ) {
                return this.editorApi.dom.fields[field].current;
            }
        }

        return null;
    }

    focus() {
        const node = this.getFirstFocusableField();

        if (node != null) {
            node.focus();
        }
    }

    getProfile() {
        let index = 1;
        const profile: ISearchProfile = {};

        this.props.group.fields.forEach(
            (field) => {
                profile[field] = {
                    enabled: true,
                    index: index,
                };

                index++;
            }
        );

        return profile;
    }

    render() {
        const group = this.props.group;
        const testId = `editor--group__${group.id}`;
        const profile = this.getProfile();
        const renderedFields = renderFieldsForPanel(
            'editor',
            profile,
            this.props.globalProps,
            this.props.fieldProps,
            null,
            null,
            'enabled',
            this.editorApi.dom.fields,
            this.props.schema
        );

        return group.useToggleBox ? (
            <ToggleBox
                testId={testId}
                ref={this.dom.toggle}
                title={group.title}
                isOpen={false}
                onClose={() => false}
                onOpen={() => false}
                scrollInView={true}
                invalid={false}
                forceScroll={false}
                paddingTop={false}
            >
                {renderedFields}
            </ToggleBox>
        ) : (
            <div
                data-test-id={testId}
                ref={this.dom.div}
            >
                {renderedFields}
            </div>
        );
    }
}
