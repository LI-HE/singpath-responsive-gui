'use strict';
var myApp = angular.module('myApp', ['myAppConfig','ngResource']);//,'aceDirective'

myApp.directive("aceEditor", [
  function() {
    var Editor, Renderer;

    Editor = require("ace/editor").Editor;
    Renderer = require("ace/virtual_renderer").VirtualRenderer;
    return {
      restrict: "E",
      require: "ngModel",
      replace: true,
      template: "<div class=\"ace-container\"></div>",
      link: function($scope, $el, attrs, model) {
        var editor, session, updateViewValue;

        editor = new Editor(new Renderer($el[0], "ace/theme/textmate"));
        session = editor.getSession();
        model.$render = function() {
          return session.setValue(model.$modelValue);
        };
        updateViewValue = function() {
          return $scope.$apply(function() {
            return model.$setViewValue(session.getValue());
          });
        };
        session.on("change", updateViewValue);
        return $scope.$on("$destroy", function() {
          return editor.removeListener("change", updateViewValue);
        });
      }
    };
  }
]);

