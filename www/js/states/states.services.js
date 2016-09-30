(function() {
    'use strict';

    angular
        .module('states')
        .factory('stateService', stateService);

    stateService.$inject = ['$state', 'STATES'];

    function stateService($state, STATES) {

        var self = this;

        self.intro = function() {
            $state.go(STATES.INTRO);
        };

        self.list = function() {
            $state.go(STATES.LIST);
        };

        self.map = function(lines) {
            $state.go(STATES.MAP, {lines: lines});
        };

        self.options = function() {
            $state.go(STATES.OPTIONS);
        };

        return self;
    };

})();
