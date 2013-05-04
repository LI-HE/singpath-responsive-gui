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

        $scope.login=function(){
			
        };     
		
		$scope.dismissModal = function(){
			$('#loginAlert').modal('hide')
		};
		
        $scope.logout=function(){
            
            $resource('/sign_out').get({}, function(response){
                $scope.logoutresponse = response;
                $scope.player = $resource('/jsonapi/player').get();
                //{"error": "No player logged in"}
                if ($scope.player.error){
                  $scope.abc = 'true';
                  $scope.def = 'false';
                }
            });
        };     
}

function InterfaceController($scope,$resource){
        $scope.interfaces = $resource('/jsonapi/interfaces').get();
}

function PathController($scope,$resource){
    $scope.paths = $resource('/jsonapi/get_game_paths').get();
    $scope.mobile_paths = null;
    $scope.path_progress = null;
    $scope.player_progress = null;

    $scope.get_player_progress = function(){
        $scope.player_progress = $resource('/jsonapi/get_player_progress').get();
    };
    //$scope.get_player_progress();

    $scope.update_path_details = function(){
        $scope.player_paths = $resource('/jsonapi/get_my_paths').get();
        $scope.current_paths = $resource('/jsonapi/get_current_paths').get();
        $scope.other_paths = $resource('/jsonapi/get_other_paths').get();
        $scope.get_mobile_paths();
    };

    $scope.get_mobile_paths = function(){
        $scope.mobile_paths = $resource('/jsonapi/mobile_paths').query();
    };
    $scope.get_mobile_paths();

    $scope.update_path_progress = function(pathID){
        $scope.PathModel = $resource('/jsonapi/get_path_progress/:pathID');

        //Including details=1 returns the nested problemset progress.
        $scope.PathModel.get({"pathID":pathID,"details":1}, function(response){
            $scope.path_progress = response;
        });
        ///jsonapi/get_path_progress/10030, 2462233, 6920762
    }; 
}

function ProblemsetController($scope,$resource){
    //$scope.pathID = null;
    $scope.problemsets = null;
    
    $scope.ProblemsetModel = $resource('/jsonapi/problemsets/:pathID');
    
    $scope.get_problemsets = function(pathID){
        $scope.problemsets = $scope.ProblemsetModel.get({"pathID":pathID});
    };
}

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


function BadgeController($scope,$resource){
        $scope.playerBadges = $resource('/jsonapi/badges_for_current_player').get();
}

//to the list of challenges EDITED by viTech
function ChallengeController($scope,$resource){
        $scope.listChallenges = $resource('/jsonapi/list_challenges').get();
}

function NormalGameController($scope,$resource,$cookieStore){
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
        if($cookieStore.get("name")){
          $scope.qid = $cookieStore.get("name").id; //retrieve quest id from Storyboard page
        }
		$scope.solution = null;
		$scope.theData = null;
		$scope.sampleAnswers = "yes";
		
		//alert($scope.qid);
        $scope.create_practice_game = function(pathID,LevelID,numProblems){
          $scope.CreateGameModel = $resource('/jsonapi/create_game');
          
          $scope.CreateGameModel.get({}, function(response){
            $scope.game = response;
            $scope.update_remaining_problems();
          });
        };
		$scope.showSampleAnswers=function(){
			$scope.sampleAnswers = "yes";
		};
		
		$scope.showOutcome = function(){
			$scope.sampleAnswers = "no";
		};
		
        $scope.create_path_game = function(pathID,numProblems){
          $scope.CreateGameModel = $resource('/jsonapi/create_game/pathID/:pathID/numProblems/:numProblems');
          //alert(pathID+" "+numProblems);
          $scope.CreateGameModel.get({"pathID":pathID,"numProblems":numProblems}, function(response){
            $scope.game = response;
            $scope.update_remaining_problems();
          });
        };

        $scope.create_quest_game = function(questID){
          $scope.CreateGameModel = $resource('/jsonapi/create_quest_game/:questID');
          //alert("Creating quest game for quest "+questID);

          $scope.NewQuestGame = $resource('/jsonapi/create_quest_game/:questID');
          $scope.NewQuestGame.get({'questID':questID}, function(response){
              $scope.game = response;
              $scope.fetch($scope.game.gameID);
              $scope.update_remaining_problems();
              $scope.update_quest();
              //alert("reply for create quest game in game model");
              //Update the parent game model by calling game fetch method. 
          });
          /*
          $scope.CreateGameModel.get({}, function(response){

            $scope.game = response;
            //Fetch the game from game ID. 
            $scope.fetch($scope.game.gameID);
            $scope.update_remaining_problems();
          });
          */
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

        $scope.check_solution_for_game = function() {
          //$scope.solution
          //$scope.current_problem
          //$scope.game.gameID
		  $scope.sampleAnswers = "no";
          $scope.SaveResource = $resource('/jsonapi/verify_for_game');
          //alert($scope.game.gameID);
          $scope.theData = {user_code:$scope.solution,
                            problem_id:$scope.current_problem,
                            game_id:$scope.game.gameID};
          
          var item = new $scope.SaveResource($scope.theData);
          item.$save(function(response) { 
                  $scope.solution_check_result = response;
                  if($scope.solution_check_result.last_solved){
                    //If you hardcode to the game, this will automatically advance the game to the next problem. 
                    $scope.fetch($scope.game.gameID);
                    $scope.update_quest();
                  }
          });

        };
        $scope.verify_solution = function() {
          //$scope.solution
          //$scope.tests
          $scope.solution_check_result = $resource('/jsonapi/check_code_with_interface').get();
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
          $scope.permutation_lines = "";
          //Loop through the permutation and add all of the lines of code
          for (var i = 0; i < $scope.permutation.length; i++) {
            //alert(parseInt($scope.permutation[i]));
            $scope.permutation_lines += $scope.game.problems.problems[$scope.current_problem_index].lines[parseInt($scope.permutation[i])-1]+"\n";
          }
          //Then put the resulting combination of lines in the solution model. 
          $scope.solution = $scope.permutation_lines;
          $scope.solution_check_result =  {"error":"This solution will not compile."};
          $scope.ner =  {"error":"This solution will not compile."};
          
          var nonErrorResult = $scope.game.problems.problems[$scope.current_problem_index].nonErrorResults[$scope.permutation];
          if(nonErrorResult){
        
            $scope.solution_check_result = nonErrorResult;
            $scope.ner = nonErrorResult;
            //If the solution passes, then call verify for the solution to progress in the game. 
            if(nonErrorResult.solved){
              $scope.check_solution_for_game();
              //alert("All solved. Checking solution for game."+nonErrorResult.solved);
            }
          }
   
        };
        $scope.update_quest = function() {
          var currentNumVideos = 1;

          $resource('/jsonapi/quest/:questID').get({"questID":$scope.game.questID},
          function(response){
            $scope.quest = response;
            //alert("Retrieved quest. Could check for video unlocks here.");
          });
        };
		
		$scope.create_quest_game($scope.qid);
}

function GameController($scope,$resource,$cookieStore,$location){
        //initialization: 
        $scope.autoCheck="yes"; //make autocheck available when page load
        $scope.notCompile = 'false'; //hide not compile warning before the game loaded
        $scope.advancedCheck = "false";
        if($cookieStore.get("name")){
          $scope.qid = $cookieStore.get("name").id; //retrieve quest id from Storyboard page
        }
        $scope.source = []; //initialize the solution drag and drop field
        
        /*
        To play a game via the SingPath API you must do the following. 
        1. Create a game using create_practice_game and get the gameID in the response. 
        2. Call check_solution_for_game() for a problem until the player correctly solves the problem. 
        3. Call fetch(gameID) to get the updated status of the game after correct solves. 
        4. Redirect the player to the proper page once the game is completed. 
        */
        //$("#example").popover({
            //placement: 'bottom',
        //});
        //$('#video').trigger('click');
        $scope.solvedProblems = 0;
        $scope.skip_problem_count = 0;
        $scope.current_problem_index = 0;
        $scope.permutation = ""; 
        $scope.permutation_lines = {origional: []};
        $scope.line_outcome = { };
        
        $scope.sourceEmpty = function() {
          //$scope.source = [];
          return $scope.source.length == 0;
        }

        $scope.modelEmpty = function() {
          return $scope.line_outcome.origional.length == 0;
        }

        $scope.assign_id = function() {
          $scope.permutation_lines = {origional: []};
          //Loop through the permutation and add all of the lines of code
          for (var i = 0; i < $scope.game.problems.problems[$scope.current_problem_index].lines.length; i++) {
              $scope.permutation_lines.origional.push({"content": $scope.game.problems.problems[$scope.current_problem_index].lines[parseInt(i)],"id": (i+1)});
          }
          $scope.line_outcome = $scope.permutation_lines;
        }

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

        $scope.create_quest_game = function(questID){
          $scope.CreateGameModel = $resource('/jsonapi/create_quest_game/:questID');
          //alert("Creating quest game for quest "+questID);

          $scope.NewQuestGame = $resource('/jsonapi/create_quest_game/:questID');
          $scope.NewQuestGame.get({'questID':questID}, function(response){
              $scope.game = response;
              $scope.fetch($scope.game.gameID);
              $scope.update_remaining_problems();
              $scope.update_quest();
              $scope.assign_id();
              //alert("reply for create quest game in game model");
              //Update the parent game model by calling game fetch method. 
          });
          /*
          $scope.CreateGameModel.get({}, function(response){

            $scope.game = response;
            //Fetch the game from game ID. 
            $scope.fetch($scope.game.gameID);
            $scope.update_remaining_problems();
          });
          */
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
          if($scope.source.length != 0){
            $scope.source = [];
          }
        }

        $scope.check_solution_for_game = function() {
          //$scope.solution
          //$scope.current_problem
          //$scope.game.gameID
          $scope.SaveResource = $resource('/jsonapi/verify_for_game');
          //alert($scope.game.gameID);
          $scope.theData = {user_code:$scope.solution,
                            problem_id:$scope.current_problem,
                            game_id:$scope.game.gameID};
          
          var item = new $scope.SaveResource($scope.theData);
          item.$save(function(response) {
              $scope.solution_check_result = response;
              if($scope.solution_check_result.last_solved){
                //If you hardcode to the game, this will automatically advance the game to the next problem. 
                $scope.fetch($scope.game.gameID);
                $scope.assign_id();
                $scope.update_quest();
              }
          });
        };

        $scope.verify_solution = function() {
          //$scope.solution
          //$scope.tests
          $scope.solution_check_result = $resource('/jsonapi/check_code_with_interface').get();
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
          $scope.permutation_lines = "";
          //Loop through the permutation and add all of the lines of code
          for (var i = 0; i < $scope.permutation.length; i++) {
            //alert(parseInt($scope.permutation[i]));
            $scope.permutation_lines += $scope.game.problems.problems[$scope.current_problem_index].lines[parseInt($scope.permutation[i])-1]+"\n";
          }
          //Then put the resulting combination of lines in the solution model. 
          $scope.solution = $scope.permutation_lines;
          $scope.solution_check_result =  {"error":"This solution will not compile."};
          $scope.ner =  {"error":"This solution will not compile."};
          
          var nonErrorResult = $scope.game.problems.problems[$scope.current_problem_index].nonErrorResults[$scope.permutation];
          if(nonErrorResult){
        
            $scope.solution_check_result = nonErrorResult;
            $scope.ner = nonErrorResult;
            //If the solution passes, then call verify for the solution to progress in the game. 
            if(nonErrorResult.solved){
              $scope.check_solution_for_game();
              //alert("All solved. Checking solution for game."+nonErrorResult.solved);
            }
          }
        };

        $scope.check_dnd_permutation = function() {
          //$scope.permutation
          //$scope.tests
          //alert("permutation="+$scope.permutation);
          //Update the solution with the permutations of lines.
          $scope.permutation = "";
          $scope.permutated_lines = "";

          for (var i = 0; i < $scope.source.length; i++) {
            //alert(parseInt($scope.permutation[i]));
            $scope.permutation += $scope.source[parseInt(i)].id.toString();
          }

          //Loop through the permutation and add all of the lines of code
          for (var i = 0; i < $scope.permutation.length; i++) {
            //alert(parseInt($scope.permutation[i]));
            $scope.permutation_lines += $scope.game.problems.problems[$scope.current_problem_index].lines[parseInt($scope.permutation[i])-1]+"\n";
          }

          //Then put the resulting combination of lines in the solution model. 
          $scope.solution = $scope.permutation_lines;
          $scope.solution_check_result =  {"error":"This solution will not compile."};
          $scope.ner =  {"error":"This solution will not compile."};
          
          var nonErrorResult = $scope.game.problems.problems[$scope.current_problem_index].nonErrorResults[$scope.permutation];
          var autocheck = $scope.autoCheck;
          var advancedcheck = $scope.advancedCheck;

          if(autocheck=="yes"){
              if(nonErrorResult){
                $scope.notCompile = 'false';
                $scope.solution_check_result = nonErrorResult;
                $scope.ner = nonErrorResult;
                
                //If the solution passes, then call verify for the solution to progress in the game. 
                if(nonErrorResult.solved){
                  //$scope.check_solution_for_game();
                  $('#pop_info_Pane').modal('show');
                  $scope.source = [];
                  //if($scope.solvedProblems == $scope.game.numProblems){
                    //document.getElementById("endVideo").style.visibility="visible";
                    //$('#endVideo').trigger('click');
                  //}
                }
                else{
                  $('#pop_info_Pane2').modal('show');
                }
              }
              else{
                $scope.notCompile = 'true';
              }
          }
          else if(autocheck=="no" && advancedcheck == "yes"){
            $scope.notCompile = 'false';
            if(nonErrorResult){
              $scope.notCompile = 'false';
              $scope.solution_check_result = nonErrorResult;
              $scope.ner = nonErrorResult;
              
              //If the solution passes, then call verify for the solution to progress in the game. 
              if(nonErrorResult.solved){
                //$('#pop_info_Pane').modal('show');
                $scope.check_solution_for_game();
                $scope.source = [];
                //if($scope.solvedProblems == $scope.game.numProblems){
                  //document.getElementById("endVideo").style.visibility="visible";
                  //$('#endVideo').trigger('click');
                //}
              }
            }
          }
        };

        $scope.update_quest = function() {
          var currentNumVideos = 1;
          $resource('/jsonapi/quest/:questID').get({"questID":$scope.game.questID},
          function(response){
            $scope.quest = response;
            //alert("Retrieved quest. Could check for video unlocks here.");
          });
        };

        $scope.play_unlocked_video = function(videoID){
          //alert($scope.quest.videos[videoID]);
          document.getElementById("video").href="http://www.youtube.com/embed/"+ $scope.quest.videos[videoID] +"enablejsapi=1&wmode=opaque"
          $('#video').trigger('click');
        }

        $scope.create_quest_game($scope.qid);
        //$scope.fetch(1798);
}


function JsonRecordController($scope,$resource){
        $scope.fetch = function(){
          ///jsonapi/get_dau_and_mau?daysAgo=1&days=28
          //$scope.JRModel = $resource('/jsonapi/rest/jsonrecord?limit=2');
          $scope.JRModel = $resource('/jsonapi/get_dau_and_mau');
          
          $scope.JRModel.get({"daysAgo":1, "days":14}, function(response){
            $scope.items = response;
          });
        };
}

//The quest controller returns a players quests or specific quest
function QuestController($scope,$resource,$location,$routeParams,$cookieStore){

    $scope.quests = new Array();
    $scope.changeRoute = 'normal_play_page.html';
    $scope.name = $cookieStore.get("name");
    //Create quest
    $scope.create_quest = function(storyID,pathID,difficulty){
/*       //alert("storyID "+storyID+" pathID "+ pathID+" difficult "+difficulty);
      $scope.SaveResource = $resource('/jsonapi/rest/quest', 
                    {}, 
                    {'save': { method: 'POST',    params: {} }});
      
      var newQuest = {"name":"New Quest",
                      "storyID": storyID,
                      "pathID":pathID,
                      "difficulty":difficulty};
      $scope.$watch('location.search()', function() {
        $scope.target = ($location.search()).target;
      }, true);
      var item = new $scope.SaveResource(newQuest);
      item.$save(function(response) {
        $scope.quest = response;
        //alert("Should redirect to next page with quest ID="+response.id);
        $scope.$parent.flash = response.id;
        $cookieStore.put("name", response.storyID);
        $location.search('questID',response.id).path('storyboard')
        $scope.list();
      }); */
      $scope.$watch('location.search()', function() {
        $scope.target = ($location.search()).target;
      }, true);
      $scope.newQuest = {}
        $scope.newQuest.storyID = storyID;
        $scope.newQuest.pathID = pathID;
        $scope.newQuest.difficulty = difficulty;

        $scope.NewQuest = $resource('/jsonapi/quest');
        var new_quest = new $scope.NewQuest($scope.newQuest);
        new_quest.$save(function(response){
          $scope.quest = response;
          $cookieStore.put("name", response);
          $scope.list();
          $location.path('storyboard');
        });
      };

    $scope.QuestModel = $resource('/jsonapi/quest/:id');
    
    //A method to fetch a generic model and id. 
    
    $scope.fetch = function(id){
      $scope.quest = $scope.QuestModel.get({'id':id});
    };

    $scope.list = function(){
      $scope.quests = $scope.QuestModel.query();
      //}
      //$scope.QuestModel.query({}, function(response){
      //    $scope.quests = response;
      //});
    };
    
    $scope.create_quest_game_from_QuestController = function(questID){
      alert("creating a new game for quest from quest controller "+questID);
      $scope.NewQuestGame = $resource('/jsonapi/create_quest_game/:questID');
      $scope.NewQuestGame.get({'questID':questID}, function(response){
        $scope.game = response;
        $scope.list();
        alert("reply for create quest game in quest model");
        //Update the parent game model by calling game fetch method. 
      });
    };

    $scope.create_new_quest = function(storyID,pathID,difficulty){
      $scope.newQuest = {}
      $scope.newQuest.storyID = storyID;
      $scope.newQuest.pathID = pathID;
      $scope.newQuest.difficulty = difficulty;

      $scope.NewQuest = $resource('/jsonapi/quest');
      var new_quest = new $scope.NewQuest($scope.newQuest);
      new_quest.$save(function(response){
        $scope.quest = response;
        $scope.list();
      });
    };

    $scope.loadLinks = function(videoID){
      //check if the herf is still "Locked"
      if($scope.name.videos[videoID] == "LOCKED"){
        $('#warningBoard').modal('show');
      }
    };

    $scope.$watch('name', function() {
      if($scope.name && $scope.name.difficulty == "Drag-n-Drop"){
        $scope.changeRoute = "playPage.html";
      }
    }, true);

    $scope.list();

}

//Test story controller. Normally use GenericController
function StoryController($scope,$resource,$cookieStore){
  $scope.name = $cookieStore.get("name");
    //$scope.StoryModel = $resource('/jsonapi/stories');
    $scope.StoryModel = $resource('/jsonapi/story');
    
    //A method to fetch a generic model and id. 
    $scope.list = function(){
          $scope.StoryModel.query({}, function(response){
              $scope.stories = response;
              //alert("There are "+$scope.stories.length+" stories.");
          });
    };
    //$scope.fetch_stories();
}

//Test story controller. Normally use GenericController
function TimeAndAttemptsController($scope,$resource){
    $scope.item = $resource('/jsonapi/attempts_and_time_by_day').get();
}

function TournamentController($scope,$resource,$http){
    $scope.TournamentModel = $resource('/jsonapi/list_open_tournaments');
    $scope.TournamentHeatGameModel = $resource('/jsonapi/create_game/heatID/:heatID');
    
    $scope.TournamentHeatModel = $resource('/jsonapi/get_heat_ranking');
    $scope.tournamentID = null;
    //$scope.heatID = 12883052;
    $scope.heat = null;
    
    //A method to fetch a generic model and id. 
    //Pass in ID
    $scope.fetch_heat = function(heatID){
          $scope.TournamentHeatModel.get({"heatID":heatID}, function(response){
              $scope.heat = response;
          });
    };

    $scope.create_heat_game = function(){
          $scope.TournamentHeatGameModel.get({"heatID":$scope.heat.heatID}, function(response){
              $scope.game = response;
          });
    };

    $scope.fetch_tournaments = function(){
          $scope.TournamentModel.query({}, function(response){
              $scope.tournaments = response;
          });
    };

    $scope.register_for_tournament = function(){
        //Use a normal form post for this legacy API.
        $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
        $http.post("/jsonapi/verify_tournament_password", {
            tournamentID: $scope.tournamentID,
            password: $scope.tournamentPassword
        }).success(function (data, status, headers, config) {
            $scope.registration_response = data;
        }).error(function (data, status, headers, config) {
            $scope.registration_response = data;
        });
    };

    $scope.play_tournament = function(){
          alert("Preparing to launch tournament game.");
          //$scope.TournamentModel.query({}, function(response){
          //    $scope.tournaments = response;
          //});
    };  
}
