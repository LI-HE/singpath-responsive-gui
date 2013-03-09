function ProblemController($scope,$resource){
    $scope.problemsetID = null;
    $scope.problems = null;

    $scope.ProblemsetProgress = $resource('/jsonapi/get_problemset_progress/:problemsetID');
    $scope.ProblemModel = $resource('/jsonapi/problems/:problemsetID');    

    $scope.get_progress = function(){
        $scope.progress = $scope.ProblemsetProgress.get({"problemsetID":$scope.problemsetID});
    };

    $scope.get_problems = function(){
        //Including ?details=1 will return if the problem has been solved. 
        //$scope.problems = $scope.ProblemModel.get({"problemsetID":$scope.problemsetID});
        $scope.problems = $scope.ProblemModel.get({"problemsetID":$scope.problemsetID, "details":1});
    };
}

function GameController($scope,$resource){
        //$scope.currentProblem
        //$scope.game = $resource('test_data/python_game.json').get();
        //$scope.mobile_game = $resource('test_data/mobile_python_game.json').get();
        
        /*
        To play a game via the SingPath API you must do the following. 
        1. Create a game using create_practice_game and get the gameID in the response. 
        2. Call check_solution_for_game() for a problem until the player correctly solves the problem. 
        3. Call fetch(gameID) to get the updated status of the game after correct solves. 
        4. Redirect the player to the proper page once the game is completed. 
        */
        $("#example").popover({
            placement: 'bottom',
        });
        $('#startVideo').trigger('click');
        $scope.skip_problem_count = 0;
        $scope.current_problem_index = 0;
        
        $scope.create_practice_game = function(pathID,LevelID,numProblems){
          $scope.CreateGameModel = $resource('/jsonapi/create_game');          
          $scope.CreateGameModel.get({}, function(response){
            $scope.game = response;
            $scope.update_remaining_problems();
          });
        };

        $scope.create_path_game = function(pathID,numProblems){
          $scope.CreateGameModel = $resource('/jsonapi/create_game/pathID/:pathID/numProblems/:numProblems');
          //alert(pathID+" "+numProblems);
          $scope.CreateGameModel.get({"pathID":pathID,"numProblems":numProblems}, function(response){
            $scope.game = response;
            $scope.update_remaining_problems();
          });
        };

        $scope.create_problemset_game = function(problemsetID,numProblems){
          $scope.CreateGameModel = $resource('/jsonapi/create_game/problemsetID/:problemsetID/numProblems/:numProblems');
          
          $scope.CreateGameModel.get({"problemsetID":problemsetID,"numProblems":numProblems}, function(response){
            $scope.game = response;
            $scope.update_remaining_problems();
          });
        };

        $scope.create_resolve_problemset_game = function(problemsetID){
          $scope.CreateGameModel = $resource('/jsonapi/create_game/problemsetID/:problemsetID/resolve');
          
          $scope.CreateGameModel.get({"problemsetID":problemsetID}, function(response){
            $scope.game = response;
            $scope.update_remaining_problems();
          });
        };         
        /*
        Create Tournament Game.
        
        */

        $scope.create_quest_game = function(questID){
          $scope.CreateGameModel = $resource('/jsonapi/create_quest_game');
          $scope.CreateGameModel.get({}, function(response){
            $scope.game = response;
            $scope.update_remaining_problems();
          });
        };
        
        $scope.fetch = function(gameID){
          $scope.GameModel = $resource('/jsonapi/game/:gameID');
          
          $scope.GameModel.get({"gameID":gameID}, function(response){
            $scope.game = response;
            $scope.update_remaining_problems();
          });
        };

        $scope.update_remaining_problems = function(){
          $scope.remaining_problems = [];
          //loop through problems and find unsolved. Add to remaining_problems.
          for (var i = 0; i < $scope.game.problemIDs.length; i++) {
            if($scope.game.solvedProblemIDs.indexOf($scope.game.problemIDs[i])<0){
              $scope.remaining_problems.push($scope.game.problemIDs[i]);
            }
          }
          //Update the current problem index based on remaining problems and items skipped. 
          $scope.move_to_next_unsolved_problem();
        };

        $scope.move_to_next_unsolved_problem = function(){
          if ($scope.remaining_problems.length>0){
            //Todo:If you are already on the problem, you don't need to reload it. 
            $scope.current_problem = $scope.remaining_problems[$scope.skip_problem_count % $scope.remaining_problems.length];
            $scope.current_problem_index = $scope.game.problemIDs.indexOf($scope.current_problem);
            $scope.solution = $scope.game.problems.problems[$scope.current_problem_index].skeleton;
            $scope.solution_check_result = null;
          }else{
            $scope.current_problem=null;
            $scope.current_problem_index = null;
            $scope.solution = null;
            $scope.solution_check_result = null;
          }
        }
        $scope.skip_problem = function(){
          if ($scope.remaining_problems.length>1){
            $scope.skip_problem_count += 1;
            $scope.move_to_next_unsolved_problem();
          }
        }

        //$scope.$watch('ner', function() {
        //    alert("Hi");
            //scope.greeting = scope.salutation + ' ' + scope.name + '!';
        //}); // initialize the watch
 
        $scope.check_solution_for_game = function() {
          //$scope.solution
          //$scope.current_problem
          //$scope.game.gameID
          //alert($scope.solution+" "+$scope.current_problem+" "+$scope.game.gameID);

          $scope.SaveResource = $resource('/jsonapi/verify_for_game');
       
          $scope.theData = {user_code:$scope.solution,
                            problem_id:$scope.current_problem,
                            game_id:$scope.game.gameID};
          
          var item = new $scope.SaveResource($scope.theData);
          item.$save(function(response) { 
                  $scope.solution_check_result = response;
                  if($scope.solution_check_result.last_solved){
                    $scope.fetch($scope.game.gameID);//To update game status.
                  }
          });

        };
        //Mobile Problem Methods
        //If the user selects a correct permutation. 
        //You can mark the permutation correct and post to the server. 
        //This will result in the game proceeding. 

        $scope.check_permutation = function() {
          //$scope.permutation
          //$scope.tests
          //alert("permutation="+$scope.permutation);
          //Update the solution with the permutations of lines.
          $scope.permutation = "";
          $scope.permutation_lines = "";
          //Loop through the permutation and add all of the lines of code
          for (var i = 0; i < $scope.game.problems.problems[$scope.current_problem_index].lines.length; i++) {
            //alert(parseInt($scope.permutation[i]));
            $scope.permutation_lines += $scope.game.problems.problems[$scope.current_problem_index].lines[parseInt(i)].content+"\n";
            $scope.permutation += "" + $scope.game.problems.problems[$scope.current_problem_index].lines[parseInt(i)].id;
          }
          //Then put the resulting combination of lines in the solution model. 
          $scope.solution = $scope.permutation_lines;
          $scope.solution_check_result =  {"error":"This solution will not compile."};
          $scope.ner = {"error":"This solution will not compile."};

          var nonErrorResult = $scope.game.problems.problems[$scope.current_problem_index].nonErrorResults[$scope.permutation];
          if(nonErrorResult){

            $scope.solution_check_result = nonErrorResult;
            $scope.ner = nonErrorResult;
            
            //If the solution passes, then call verify for the solution to progress in the game. 
            if(nonErrorResult.solved){
                //var r = confirm("Congratulations! We are going to the next question.");
                $('#pop_info_Pane').modal('show');
                
                $scope.check_solution_for_game();
                alert("All solved. Checking solution for game."+nonErrorResult.solved);
            }
          }
   
        };       

}

function dndCtrl($scope) {

    //$scope.watchEvent = function($event){
          //$scope.clicked = $event.target.name;
    //      $scope.check_permutation();
          //alert("Event "+ $event.target.name);
          //$scope.log_event($scope.clicked);
    //};
    
    $scope.sourceEmpty = function() {
        return $scope.source.length == 0;
    }

    $scope.modelEmpty = function() {
        return $scope.model.length == 0;
    }
    //Listen for change
    //{{check_permutation()}}
    /*var havePlayed = false;
    $scope.validate = function() {
        if($scope.model[0].id == 1 && $scope.model[1].id == 2 && $scope.model[2].id == 3 && havePlayed == false){
            havePlayed = true;
            window.alert("Good Job! We will go to 2nd question");
            window.location = "#question2";
        }
    }*/

}

function dndCtrlq2($scope) {

    $scope.model = [
        {
            "id": 1,
            "value": "for a good reason" 
        },
        {
            "id": 2,
            "value": "coding hard"
        },
        {
            "id": 3,
            "value": "is it correct?"
        },
        {
            "id": 4,
            "value": "or wrong?"
        },
    ];

    $scope.source = [
        {
            "id": 1,
            "value": "for a good reason" 
        },
        {
            "id": 2,
            "value": "coding hard"
        },
        {
            "id": 3,
            "value": "is it correct?"
        },
        {
            "id": 4,
            "value": "or wrong?"
        },
    ];

    $scope.modelEmpty = function() {
        return $scope.model.length == 0;
    }

    var havePlayed = false;
    $scope.validate = function() {
        if($scope.model[0].id == 2 && $scope.model[1].id == 1 && $scope.model[2].id == 3 && havePlayed == false){
            havePlayed = true;
            window.alert("Good Job! We will go to 3rd question");
            window.location = "#question3";
        }
    }

}

function dndCtrlq3($scope) {

    $scope.model = [
        {
            "id": 2,
            "value": "Year 2"
        },
        {
            "id": 1,
            "value": "Year 1"
        },
        {
            "id": 3,
            "value": "Year 3"
        },
        {
            "id": 4,
            "value": "Year 4"
        },
    ];

    $scope.source = [
        {
            "id": 2,
            "value": "NTU"
        },
            {
            "id": 1,
            "value": "SMU"
        },
        {
            "id": 3,
            "value": "NUS"
        },
        {
            "id": 4,
            "value": "SUTD"
        },
    ];

    $scope.sourceEmpty = function() {
        return $scope.source.length == 0;
    }

    $scope.modelEmpty = function() {
        return $scope.model.length == 0;
    }

    var havePlayed = false;
    $scope.validate = function() {
        if($scope.model[0].id == 1 && $scope.model[1].id == 2 && $scope.model[2].id == 3 && $scope.source[0].id == 1 && $scope.source[1].id == 2 && $scope.source[2].id == 3 && havePlayed == false){
            havePlayed = true;
            window.alert("Good Job! We will go to 4th question");
            window.location = "#question4";
        }
    }

}

function dndCtrlq4($scope) {

    $scope.model = [
        {
            "id": 2,
            "value": "x=2"
        },
        {
            "id": 1,
            "value": "x=1"
        },
        {
            "id": 3,
            "value": "x=3"
        },
        {
            "id": 4,
            "value": "x=4"
        },
    ];

    $scope.source = [
        {
            "id": 1,
            "value": "y=1"
        },
            {
            "id": 2,
            "value": "y=2"
        },
        {
            "id": 3,
            "value": "y=3"
        },
        {
            "id": 4,
            "value": "y=4"
        },
    ];

    $scope.sourceEmpty = function() {
        return $scope.source.length == 0;
    }

    $scope.modelEmpty = function() {
        return $scope.model.length == 0;
    }

    var havePlayed = false;
    $scope.validate = function() {
        if($scope.model[0].id == 1 && $scope.model[1].id == 2 && $scope.model[2].id == 3 && havePlayed == false){
            havePlayed = true;
            window.alert("Good Job! We will go to 5th question");
            window.location = "#question5";
        }
    }

}

function dndCtrlq5($scope) {

    $scope.model = [
        {
            "id": 1,
            "value": "Monday"
        },
        {
            "id": 3,
            "value": "Wednesday"
        },
        {
            "id": 5,
            "value": "Friday"
        },
        {
            "id": 6,
            "value": "x=1"
        },
    ];

    $scope.source = [
        {
            "id": 2,
            "value": "Tuesday"
        },
            {
            "id": 4,
            "value": "Thursday"
        },
        {
            "id": 7,
            "value": "x=2"
        },
    ];

    $scope.sourceEmpty = function() {
        return $scope.source.length == 0;
    }

    $scope.modelEmpty = function() {
        return $scope.model.length == 0;
    }

    var havePlayed = false;
    $scope.validate = function() {
        if($scope.model[0].id == 1 && $scope.model[1].id == 2 && $scope.model[2].id == 3 && $scope.source[0].id == 6 && $scope.source[1].id == 7 && havePlayed == false){
            havePlayed = true;
            $('#endVideo').trigger('click');
        }
    }

}