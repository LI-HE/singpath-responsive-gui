/* Controllers */

function NewProblemController($scope,$resource,$cookieStore){
  $scope.InterfaceID = null;

  $scope.interfaces = null;

  $scope.defaults_for_path_problems = {"skeleton":"#spam=2",
                                      "examples":">>> spam \n 2 \n>>> addOne(2)\n 3 ",
                                      "exampleSolution": "spam=2 \ndef addOne(x): return x+1",
                                      "exampleTests": ">>> spam \n 2 \n>>> addOne(2)\n 3 \n>>> spam \n3 \n>>> addOne(2)\n 2 ",
                                      };

  
  $scope.load_defaults = function(problem){
     //$scope.defaults_for_path_problems = $resource('/jsonapi/defaults_for_path_problems?pathID='+$scope.pathID).get({}, function(response){
        
    //});
    problem.skeleton = $scope.defaults_for_path_problems.skeleton;
    problem.examples = $scope.defaults_for_path_problems.examples;
    problem.solution = $scope.defaults_for_path_problems.exampleSolution;
    problem.tests = $scope.defaults_for_path_problems.exampleTests;
    
  }
  $scope.supported_langugages = [
          {language : 'python', urlName : 'python' },       
          {language : 'scipy', urlName : 'scipy' },
          {language : 'java', urlName : 'java' },
          {language : 'r', urlName : 'r' },
          {language : 'oc', urlName : 'oc' },
          {language : 'c', urlName : 'c' },
          {language : 'ruby', urlName : 'ruby' },
          {language : 'js', urlName : 'js' },
          ];

    $scope.language = 'python';

    $scope.status = "Ready"
        //Load some good code


    $scope.VerifierModel = $resource('http://ec2-122-248-221-204.ap-southeast-1.compute.amazonaws.com/:language',
                                {},{'get': {method: 'JSONP', isArray: false, params:{vcallback: 'JSON_CALLBACK'}}
                                   }
                            );

    $scope.verify = function(){
          data = {solution: $scope.problem.solution, tests: $scope.problem.tests}
          //jsonrequest = JSON.stringify(data) 
          jsonrequest = btoa(JSON.stringify(data));

          $scope.status = "Verifying"
          //$scope.solution = "y=5"
          $scope.VerifierModel.get({'language':$scope.language,
                                    'jsonrequest':jsonrequest},
                function(response) { 
                  $scope.result = response;
                   $scope.status = "Ready"
                });  
    };
    $scope.verify_private = function(){
          data = {solution: $scope.problem.solution, tests: $scope.problem.privatetests}
          //jsonrequest = JSON.stringify(data) 
          jsonrequest = btoa(JSON.stringify(data));

          $scope.status = "Verifying"
          //$scope.solution = "y=5"
          $scope.VerifierModel.get({'language':$scope.language,
                                    'jsonrequest':jsonrequest},
                function(response) { 
                  $scope.privateresult = response;
                   $scope.status = "Ready"
                });  
    };
    
}
function ContributionController($scope,$resource,$cookieStore){
    
    $scope.needed = [];

    var new_need = {'language':'Python', 
                    'description':'More problems needed',
                    'pathID':10030,
                    'problemsetID':11021}

    $scope.needed.push(new_need);
    $scope.needed.push(new_need);
    $scope.needed.push(new_need);
    
    /*
    $parent.$parent.$parent.pathID=need.pathID;
    $parent.$parent.problemsetID=11021;
    $parent.get_problemsets($parent.$parent.pathID);
    $parent.problemsetID=11021;
    $parent.get_problems();
    target=5;
    $parent.problems.problems.splice(5, 0, 'testing');

    */
    
    
    $scope.list_problems = function(need){
        $scope.$parent.$parent.$parent.pathID=need.pathID;
        $scope.$parent.$parent.problemsetID=need.problemsetID;
        $scope.$parent.get_problemsets(need.pathID);
        $scope.$parent.problemsetID=need.problemsetID;
        $scope.$parent.get_problems();
    }

    $scope.get_needed_problems = function(gameID){
        $scope.NeededModel = $resource('/jsonapi/needed_problems');
          
          $scope.NeededModel.get({}, function(response){
            $scope.needed = response;
          });
        };

		//$scope.get_needed_problems();
}
