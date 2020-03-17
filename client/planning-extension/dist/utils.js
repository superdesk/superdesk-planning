"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getAssignmentService() {
    var injector = angular.element(document.body).injector();
    return injector.get('assignments');
}
exports.getAssignmentService = getAssignmentService;
