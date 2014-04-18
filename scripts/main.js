var app = angular.module('soda_mixture', ['ngResource']);

app.config(['$httpProvider', function($httpProvider) {	
	$httpProvider.defaults.headers.common['Authorization'] = "***";
}]);

app.config(function($routeProvider, $locationProvider) {
	//$locationProvider.html5Mode(true);
	
	$routeProvider.
	when('/', {templateUrl:'views/home.html', controller: HomeCtrl}).
	when('/about', {templateUrl:'views/about.html', controller: AboutCtrl}).
	when('/contact', {templateUrl:'views/contact.html', controller: ContactCtrl}).
	when('/mixtures', {templateUrl: 'views/mixtures.html', controller: MixturesCtrl}).
	when('/mixtures/:mixture_id', {templateUrl: 'views/mixture.html', controller: MixDetailCtrl}).
	otherwise({redirectTo: '/'});
});





// Services //
app.factory('Mixtures', function($resource, $cacheFactory){
	var mixture_cache = $cacheFactory('Mixtures');
	var mixture_resource = $resource('https://baas.kinvey.com/appdata/kid_eT9BhXt_p5/Mixtures', [], {get: { method: 'GET', isArray:true}});	
	
  	return {
		get: function() {
			var mixtures = mixture_cache.get('Mixtures');
			if (!mixtures) {
				mixtures = mixture_resource.get(function(){
					mixture_cache.put('Mixtures', mixtures); 
				});
			}
			return mixtures;
		}
	};
});





// Directives //
app.directive("smRatings", function ($compile) {
    function createStars(rating) {
        var stars = '';
		var empty_stars = 5;
		var full_stars = Math.floor(rating);
        
		for (var i = 0; i < full_stars; i++) {
            stars += '<i class="icon-star"></i>';
        }
		
		empty_stars -= full_stars;
		
		if((rating - full_stars) == .5){
			stars += '<i class="icon-star-half"></i>';
			empty_stars -= 1;
		}
		
		for(var i = 0; i < empty_stars; i++){
			stars += '<i class="icon-star-empty"></i>';
		}
		
        return stars;
    }

    return{
        restrict:"A",
		scope: { smRatings: '@'},
        link:function (scope, element, attrs) {
			scope.$watch('smRatings', function(value) {
				element.html(createStars(value));
			});
        }
    }
});





// Controllers //
function HomeCtrl($scope, $location, $window, Mixtures) {
	$scope.mixtures = Mixtures.get();
	$scope.$on('$viewContentLoaded', function(event) {
		$window._gaq.push(['_trackPageview', $location.path()]);
	});
}

function MixturesCtrl($scope, $location, $window, Mixtures) {
	$scope.mixtures = Mixtures.get();
	$scope.sorting_order = 'date';
	$scope.updateSortingOrder = function(order){
		$scope.sorting_order = order;
	}
	$scope.$on('$viewContentLoaded', function(event) {
		$window._gaq.push(['_trackPageview', $location.path()]);
	});
}

function MixDetailCtrl($scope, $routeParams, Mixtures, $filter, $location, $window) {
	$scope.mixtures = Mixtures.get();
	$scope.$watch('mixtures', function(mixtures) {
		$scope.mixture = ($filter('filter')($scope.mixtures, {_id:$routeParams.mixture_id}))[0];
		
		// $("#soda").on("change", function(e){
		//   	var soda = new Soda();
		// 	soda.Initialize('soda');
		// });
	}, true);
	$scope.$on('$viewContentLoaded', function(event) {
		$window._gaq.push(['_trackPageview', $location.path()]);
	});

	$('html, body').scrollTop(0);
}

function AboutCtrl($scope, $location, $window) {
	$scope.$on('$viewContentLoaded', function(event) {
		$window._gaq.push(['_trackPageview', $location.path()]);
	});
}

function ContactCtrl($scope, $location, $window) {
	$scope.$on('$viewContentLoaded', function(event) {
		$window._gaq.push(['_trackPageview', $location.path()]);
	});
}



