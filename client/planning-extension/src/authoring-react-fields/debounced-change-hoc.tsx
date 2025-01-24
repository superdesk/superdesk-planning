import {DebouncedFunc, debounce, cloneDeep, set} from 'lodash';
import React = require('react');

interface IDebouncedChangeHOCProps<T> {
    children: (changedValue: T, onChange: (fieldPath: string, value: T) => void) => JSX.Element;
    value: T;
    onChange: (newValue: T) => void;
}

interface IDebouncedChangeHOCState<T> {
    renderedValue: T;
}

export class DebouncedChangeHOC<T extends Array<any>> extends React.PureComponent<IDebouncedChangeHOCProps<T>, IDebouncedChangeHOCState<T>> {
    debouncedFn: DebouncedFunc<() => void>;
    changeQueue: Array<{fieldPath: string; value: any;}>;

    constructor(props: IDebouncedChangeHOCProps<T>) {
        super(props);

        this.state = {
            renderedValue: this.props.value,
        };

        this.changeQueue = [];
        this.debouncedFn = debounce(() => {
            const itemCopy = cloneDeep({coverages: this.props.value});

            this.changeQueue.forEach((x) => {
                set(itemCopy, x.fieldPath, x.value);
            });

            for (const coverage of itemCopy.coverages) {
                if (coverage.planning != null) {
                    delete coverage.planning['_scheduledTime'];
                }
            }

            this.props.onChange(itemCopy.coverages);
            this.changeQueue = [];
        }, 1500);
    }

    componentWillUnmount(): void {
        this.debouncedFn.cancel();
    }

    render() {
        return this.props.children(
            this.state.renderedValue,
            (fieldPath, value) => {
                this.changeQueue = [
                    ...this.changeQueue,
                    {fieldPath, value}
                ];

                const clonedValue = cloneDeep({coverages: this.state.renderedValue});

                this.changeQueue.forEach((x) => {
                    set(clonedValue, x.fieldPath, x.value);
                });

                this.setState({
                    renderedValue: clonedValue.coverages,
                });

                this.debouncedFn();
            },
        )
    }
}
