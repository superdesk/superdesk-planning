## Front-end checklist

<!--- Go over all the following points, and put an `x` in all the boxes that apply. -->
- [ ] This pull request is adding missing TypeScript types to modified code segments where it's easy to do so with confidence
- [ ] This pull request is using TypeScript interfaces instead of prop-types and updates usages where it's quick to do so
- [ ] This pull request is using `memo` or `PureComponent` to define new React components (and updates existing usages in modified code segments)
- [ ] This pull request is replacing `lodash.get` with optional chaining and nullish coalescing for modified code segments
- [ ] This pull request is not importing anything from client-core directly (use `superdeskApi`)
- [ ] This pull request is importing UI components from `superdesk-ui-framework` and `superdeskApi` when possible instead of using ones defined in this repository.
- [ ] This pull request is not using `planningApi` where it is possible to use `superdeskApi`
- [ ] This pull request is not adding redux based modals
- [ ] In this pull request, properties of redux state are not being passed as props to components; instead, we connect it to the component that needs them. Except components where using a react key is required - do not connect those due to performance reasons.
- [ ] This pull request is not adding redux actions that do not modify state (e.g. only calling angular services; those should be moved to `planningApi`)
