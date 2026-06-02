# Long term refactoring goals

* Replace current event and planning item editor with react-based authoring component from superdesk (see `getAuthoringComponent` in `superdeskApi`)
* Refactor `EventItem` and `PlanningItem` components so they do not connect to a redux store