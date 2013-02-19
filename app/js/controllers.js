'use strict';

/* Controllers */
//The index controller is mainly used for logging all clicks. 
//Logging to Google Analytics and SingPath
function IndexController($scope,$resource,$location,$window){
    
    $scope.location = $location;
    $scope.log_event = function($event){
        
        $scope.clicked = $event.target.name;
        //Log event to Google Analytics
        //This will log from 127.0.0.1 but not local host. 
        $window._gaq.push(['_trackPageview', $scope.clicked]);
        //This is how you log to the SingPath backend.
        $scope.Log = $resource('/jsonapi/log_access');
        var item = new $scope.Log({"page":"index1.html",
                                   "event":$scope.clicked,
                                   "date":1357529747177});
        $scope.item = item.$save(); 
    };

}

function Ctrl($scope) {
  $scope.color = 'blue';
}

function PlayerController($scope,$resource){
        $scope.player = $resource('/jsonapi/player').get();        
}

function InterfaceController($scope,$resource){
        $scope.interfaces = $resource('/jsonapi/interfaces').get();
}

function PathController($scope,$resource){
    $scope.paths = $resource('/jsonapi/get_game_paths').get();
    $scope.path_progress = {};

    $scope.update_path_details = function(){
        $scope.player_paths = $resource('/jsonapi/get_my_paths').get();
        $scope.current_paths = $resource('/jsonapi/get_current_paths').get();
        $scope.other_paths = $resource('/jsonapi/get_other_paths').get();
    };

    $scope.update_path_progress = function(pathID){
        $scope.PathModel = $resource('/jsonapi/get_path_progress/:pathID');

        $scope.PathModel.get({"pathID":pathID}, function(response){
            $scope.path_progress[pathID] = response;
        });
        ///jsonapi/get_path_progress/10030, 2462233, 6920762
    }; 
}

function BadgeController($scope,$resource){
        $scope.playerBadges = $resource('/jsonapi/badges_for_current_player').get();
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
        $scope.skip_problem_count = 0;
        $scope.current_problem_index = 0;
        $scope.permutation = "12345"; 
        
        $scope.create_practice_game = function(pathID,LevelID,difficulty,numProblems){
          $scope.CreateGameModel = $resource('/jsonapi/create_game');
          
          $scope.CreateGameModel.get({}, function(response){
            $scope.game = response;
            $scope.update_remaining_problems();
          });
        };

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
          // game/0, 2, 3
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
          if ($scope.remaining_problems.length>0){
            $scope.current_problem = $scope.remaining_problems[$scope.skip_problem_count % $scope.remaining_problems.length];
            $scope.current_problem_index = $scope.game.problemIDs.indexOf($scope.current_problem);
            $scope.solution = $scope.game.problems.problems[$scope.current_problem_index].skeleton;
          }else{
            $scope.current_problem=null;
            $scope.current_problem_index = null;
            $scope.solution = null;
          }
        };

        $scope.skip_problem = function(){
          if ($scope.remaining_problems.length>1){
            $scope.skip_problem_count += 1;
            $scope.current_problem = $scope.remaining_problems[$scope.skip_problem_count % $scope.remaining_problems.length];
            $scope.current_problem_index = $scope.game.problemIDs.indexOf($scope.current_problem);
            $scope.solution = $scope.game.problems.problems[$scope.current_problem_index].skeleton;
          }
        }

        $scope.check_solution_for_game = function() {
          //$scope.solution
          //$scope.current_problem
          //$scope.game.gameID
          
          $scope.SaveResource = $resource('/jsonapi/verify_solution.php');
       
          $scope.theData = {user_code:"oops =317",
                            problem_id:10033,
                            game_id:14101372};

          var item = new $scope.SaveResource($scope.theData);
          item.$save(function(response) { 
                  $scope.solution_check_result = response;
                  //If solved, go to next problem
                  //Refetch the game in the background.
          });

        };
        $scope.verify_solution = function() {
          //$scope.solution
          //$scope.tests
          $scope.solution_check_result = $resource('/jsonapi/check_code_with_interface').get();
        };
        //Mobile Problem Methods
        $scope.check_permutation = function() {
          //$scope.permutation
          //$scope.tests
          //alert("permutation="+$scope.permutation);
          $scope.solution_check_result =  {"error":"This solution will not compile."};
          $scope.ner =  {"error":"This solution will not compile."};
          
          var nonErrorResult = $scope.game.problems.problems[$scope.current_problem_index].nonErrorResults[$scope.permutation];
          if(nonErrorResult){
            $scope.solution_check_result = nonErrorResult;
            $scope.nonErrorResult = nonErrorResult;
          }
   
        };
       

}

//The quest controller returns a players quests or specific quest
function QuestController($scope,$resource){
    $scope.quests = [];
    //$scope.quest = {"name":"Quest 1","image": "http://someimage.com/someimage.jpg"};  
    
    $scope.QuestModel = $resource('/jsonapi/quest/:id');
    
    //A method to fetch a generic model and id. 
    
    $scope.fetch = function(id){
      $scope.quest = $scope.QuestModel.get({'id':id});
    };

    $scope.list = function(){
      $scope.quests = $scope.QuestModel.query();
      //$scope.QuestModel.query({}, function(response){
      //    $scope.quests = response;
      //});
    };
    
    $scope.list();

}

//This could be used for development.
//Just create methods to pass in and set the model and id. 
function StoryController($scope,$resource){
    //$scope.location = $location;
		$scope.StoryModel = $resource('/jsonapi/stories');
    
    $scope.story = {"name":"My Cool Story", 
                    "url": "ae_DKNwK_ms"};  
		//A method to fetch a generic model and id. 
    $scope.fetch_stories = function(){
          $scope.StoryModel.query({}, function(response){
              $scope.stories = response;
              //alert("There are "+$scope.stories.length+" stories.");
          });
    };
    $scope.add = function(){
          //Wait for the response and then update phones.
          $scope.AddStory = $resource('/jsonapi/add_story');

          var new_story = new $scope.AddStory($scope.story);
          new_story.$save(function(response){
              //$scope.story = response;
              $scope.fetch_stories();
          });
    };
    $scope.fetch_stories();
}
