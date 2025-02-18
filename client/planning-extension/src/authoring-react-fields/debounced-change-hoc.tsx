import {PureComponent} from 'react';
import {DebouncedFunc, debounce, difference} from 'lodash';
import {IPlanningCoverageItem} from '../../../interfaces';

interface IProps {
    children: (
        changedValue: Array<IPlanningCoverageItem>,
        onChange: (fieldPath: string, value: any) => void,
    ) => JSX.Element;
    value: Array<IPlanningCoverageItem>;
    onChange: (newValue: Array<IPlanningCoverageItem>) => void;
    processChangeQueue: (changeQueue: Array<{fieldPath: string; value: any;}>, value: any) => any;
}

interface IState {
    renderedValue: Array<IPlanningCoverageItem>;
}

export class DebouncedChangeHOC extends PureComponent<IProps, IState> {
    debouncedFn: DebouncedFunc<() => void>;
    changeQueue: Array<{fieldPath: string; value: any;}>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            renderedValue: this.props.value,
        };

        this.changeQueue = [];
        this.debouncedFn = debounce(() => {
            const valueUpdated = this.props.processChangeQueue(this.changeQueue, this.props.value);

            this.props.onChange(valueUpdated);
            this.changeQueue = [];
        }, 1000, {leading: true});
    }

    static getDerivedStateFromProps(props: IProps, state: IState) {
        debugger
        console.log(difference(props.value, state.renderedValue));
        // Fired when setState is triggered. So changes just happened, but then this reverts the changes to ones from props
        // then debounced function fires, props update and state gets set to actual value.
        if (difference(props.value, state.renderedValue).length > 0) {
            return {
                renderedValue: props.value,
            };
        }
        return null;
    }

    componentWillUnmount(): void {
        this.debouncedFn.flush();
    }

    render() {
        return this.props.children(
            this.state.renderedValue,
            (fieldPath, value) => {
                this.changeQueue = [
                    ...this.changeQueue,
                    {fieldPath, value},
                ];

                this.setState({
                    renderedValue: this.props.processChangeQueue(this.changeQueue, this.state.renderedValue),
                });

                this.debouncedFn();
            },
        );
    }
}
