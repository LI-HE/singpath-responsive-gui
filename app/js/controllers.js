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
    $scope.mobile_paths = null;
    $scope.path_progress = {};

    $scope.update_path_details = function(){
        $scope.player_paths = $resource('/jsonapi/get_my_paths').get();
        $scope.current_paths = $resource('/jsonapi/get_current_paths').get();
        $scope.other_paths = $resource('/jsonapi/get_other_paths').get();
        $scope.get_mobile_paths();
    };

    $scope.get_mobile_paths = function(){
        $scope.mobile_paths = $resource('/jsonapi/mobile_paths').query();
    }

    $scope.update_path_progress = function(pathID){
        $scope.PathModel = $resource('/jsonapi/get_path_progress/:pathID');

        //Including details=1 returns the nested problemset progress.
        $scope.PathModel.get({"pathID":pathID,"details":1}, function(response){
            $scope.path_progress[pathID] = response;
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
          $scope.CreateGameModel = $resource('/jsonapi/create_game/questID/:questID');
          //alert("Creating quest game for quest "+questID);
          $scope.CreateGameModel.get({"questID":questID}, function(response){
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
          $scope.SaveResource = $resource('/jsonapi/verify_for_game');
       
          $scope.theData = {user_code:$scope.solution,
                            problem_id:$scope.current_problem,
                            game_id:$scope.game.gameID};
          
          var item = new $scope.SaveResource($scope.theData);
          item.$save(function(response) { 
                  $scope.solution_check_result = response;
                  if($scope.solution_check_result.last_solved){
                    //If you hardcode to the game, this will automatically advance the game to the next problem. 
                    $scope.fetch($scope.game.gameID);
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
       

}

//The quest controller returns a players quests or specific quest
function QuestController($scope,$resource){
    $scope.quests = [];
    //$scope.quest = {"name":"Quest 1","image": "http://someimage.com/someimage.jpg"};  
    
    //Create quest
    $scope.create_quest = function(storyID,pathID,difficulty){
          //alert("storyID "+storyID+" pathID "+ pathID+" difficult "+difficulty);
          $scope.SaveResource = $resource('/jsonapi/rest/quest', 
                        {}, 
                        {'save': { method: 'POST',    params: {} }});
          
          var newQuest = {"name":"New Quest",
                          "storyID": storyID,
                          "pathID":pathID,
                          "difficulty":difficulty};

          var item = new $scope.SaveResource(newQuest);
          item.$save(function(response) { 
                  $scope.quest = response;
                  $scope.list();
                }); 
        };

    $scope.QuestModel = $resource('/jsonapi/rest/quest/:id');
    
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

//Test story controller. Normally use GenericController
function StoryController($scope,$resource){
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



//Just create methods to pass in and set the model and id. 
function GenericController($scope,$resource){
    $scope.modelType = null;

    $scope.Model = $resource('/jsonapi/rest/:modelType/:id');
    
    //A method to fetch a generic model and id. 
    ///jsonapi/rest/player
    $scope.fetch = function(id){
          $scope.Model.get({"modelType":$scope.modelType,"id":id}, function(response){
              $scope.items = response;
          });
    };
    //Needs to be just like the Plunkr. Paste in that code. 
    $scope.add = function(){
          var new_item = new $scope.Model($scope.item);
          new_story.$save(function(response){
              $scope.item = response;
              $scope.fetch();
          });
    };

}
//Repeat for mobile problem analysis

function VerifyRequestController($scope,$resource){
        
        $scope.analyze = function(){
          var byurl = {}
          for (var i = 0; i < $scope.items.length; i++) {
            if($scope.items[i].url in byurl){
              byurl[$scope.items[i].url].vrs.push($scope.items[i]);
              byurl[$scope.items[i].url][$scope.items[i].result] += 1;
            }
            else {
              byurl[$scope.items[i].url] = {'vrs':[],'TIMEOUT':0,'ERROR':0,'PASS':0,'FAIL':0,'PRIVATE_FAIL':0};
              byurl[$scope.items[i].url].vrs.push($scope.items[i]);
              byurl[$scope.items[i].url][$scope.items[i].result] += 1;
            }
            
          }         
          //for entry in items, add to some counter and return
          $scope.result = byurl;
        };
}

//Change this to IPAccessPoints
function IPAccessController($scope,$resource){
        //$scope.model = null;
        //$scope.item = null;
        $scope.items = [];
        $scope.points = {};
        $scope.offset = 0;
        $scope.model = 'ipuser';
        $scope.Model = $resource('/jsonapi/rest/:model/:id');
        
        $scope.list = function(){
          var data = {'model':$scope.model}
          $scope.Model.query(data,
                function(response) { 
                  $scope.items = response;
                  $scope.offset = $scope.items.length;
                });  
        };

        $scope.append_list = function(){

          var data = {'model':$scope.model, 'offset':$scope.offset}
          $scope.Model.query(data,
                function(response) { 
                  var temp = response;
                  $scope.items = $scope.items.concat(temp);
                  $scope.offset += temp.length;
                  $scope.look_up_ips();
                  //alert("items "+$scope.items.length+" offset "+$scope.offset+" length "+$scope.items.length)
                });  
        };

        $scope.look_up_ips = function(){
            //alert("looking up ips");
            for (var i = 0; i < $scope.items.length; i++) {

              if($scope.items[i].ip in $scope.points){

              }
              else{
                //alert("point not in list "+$scope.items[i].ip);
                try{
                  var point = $resource('/jsonapi/rest/ipaddress/'+$scope.items[i].ip).get();
                  $scope.points[$scope.items[i].ip] = point;

                }
                catch(err){
                //Handle errors here
                }
                              }
              //$scope.permutation_lines += $scope.game.problems.problems[$scope.current_problem_index].lines[parseInt($scope.permutation[i])-1]+"\n";
            }
            
            //for key in points, put them in the items array to plot. 
            //for (var i = 0; i < $scope.items.length; i++) {
            $scope.point_list = [];
            for (var key in $scope.points) {
              if ($scope.points.hasOwnProperty(key)) {
                $scope.point_list.push($scope.points[key]);
              }
            }
         
            //alert("there were "+Object.keys($scope.points).length+" keys and point_list length is "+$scope.point_list.length);

        };       
                
        $scope.load = function(id){
          var data = {'model':$scope.model, 
                      'id': id
                     }
          $scope.waiting = "Loading";
          $scope.Model.get(data, 
              function(response){   
                  $scope.item = response; 
              });        
        };
}

function GameResultController($scope,$resource){
        $scope.items = [];
        //$scope.analysis = {};
        $scope.offset = 0;
        $scope.model = 'gameresult';
        $scope.Model = $resource('/jsonapi/rest/:model/:id');
        
        $scope.list = function(){
          var data = {'model':$scope.model}
          $scope.Model.query(data,
                function(response) { 
                  $scope.items = response;
                  $scope.offset = $scope.items.length;
                });  
        };

        $scope.append_list = function(){

          var data = {'model':$scope.model, 'offset':$scope.offset}
          $scope.Model.query(data,
                function(response) { 
                  var temp = response;
                  $scope.items = $scope.items.concat(temp);
                  $scope.offset += temp.length;
                  $scope.analyze();
                  //alert("items "+$scope.items.length+" offset "+$scope.offset+" length "+$scope.items.length)
                });  
        };

        $scope.analyze = function(){
            $scope.analysis = {};
            for (var i = 0; i < $scope.items.length; i++) {
              var day = $scope.items[i].game_start.split('T')[0];
              //time = $scope.items[i].game_start.split('T')[1];
              //if ($scope.points.hasOwnProperty(key))
              if(day in $scope.analysis){
                //alert("Found key");
                $scope.analysis[day].attempts += $scope.items[i].attempts;
                $scope.analysis[day].solve_time += $scope.items[i].solve_time;
                $scope.analysis[day].thePlayers[$scope.items[i].player] = 1;
              }
              else{
                //alert("Did not find key");
                $scope.analysis[day] = {"attempts": $scope.items[i].attempts, 
                                        "solve_time":$scope.items[i].solve_time,
                                        "thePlayers": {}};
              }
              //Count the number of players
              var keys = [];
              for(var key in $scope.analysis[day].thePlayers){
                keys.push(key);
              }
              $scope.analysis[day].players = keys;
            }
         
        };       
}

function CohortAnalysisController($scope,$resource){
        //$scope.items = [];
        //$scope.analysis = {};
        //$scope.offset = 0;
        $scope.event = "ALL";
        $scope.countryCodes = {"SG":"Singapore", "ALL":null};
        $scope.countryCode = "SG";
        $scope.cohort_events = {};
        $scope.cohort_event_count = {};
        $scope.players_by_join_day = {}; //lists of players
        $scope.player_events = {}; //list of events
        $scope.event_count = {};
        $scope.players_event_count = {};
        
        //$scope.Player = $resource('/jsonapi/rest/player/:id');
        $scope.Player = $resource('/jsonapi/players');
        
        $scope.IPUser = $resource('/jsonapi/ipuser/:id');
           
        $scope.players = [];     
        $scope.player_offset = 0;

        $scope.get_players = function(){
          //Can change url away from rest default and pass in countryCode to just
          //Look at Singapore players. 
          //var data = {'limit':limit, 'offset':0};
          var data = {};
          $scope.Player.query(data,
                function(response) { 
                  var temp = response;
                  $scope.players = $scope.players.concat(temp);
                  $scope.player_offset = $scope.players.length;
                  
                  //$scope.players = response;
                  //$scope.player_offset = $scope.players.length;
                  $scope.get_player_events();
                });  
        };

        $scope.keys = function(obj){
          var keys = [];
          for(var key in obj){
            if(key=="$$hashKey"){
              //alert(key);
            }
            else{
              keys.push(key);
            }
          }
          return keys;
        };
        
        $scope.get_player_events = function(){

          for (var i = 0; i < $scope.players.length; i++) {
              var d = new Date($scope.players[i].created);
              //alert("Date "+d);
              var join_day = $scope.players[i].created.split('T')[0];
              //var join_day = d.toDateString();
              
              if(join_day in $scope.players_by_join_day){
                //alert("Found key");
                $scope.players_by_join_day[join_day].push($scope.players[i].id);
              }
              else{
                $scope.players_by_join_day[join_day] = [];
                $scope.players_by_join_day[join_day].push($scope.players[i].id);
               }
              
              //Fetch the last 100 events for every player
              //$scope.player_events[$scope.players[i].id] = $scope.IPUser.query({'player': $scope.players[i].id});
              //$scope.fetch_events_for_player($scope.players[i].id);

              $scope.fetch_events_for_player($scope.players[i],0);                 
          }
          //$scope.analyze_player_events();

        };



        $scope.analyze_player_events = function(){
          $scope.event_list = {"ALL":0};

          $scope.cohort_event_count = {}; //[event][join_day][days_later][playerID]=count
          $scope.cohort_event_count["ALL"] = {}; //[event][join_day][days_later][playerID]=count
          $scope.return_vist_count = {}; //returns per cohort after day 0

          for (var i = 0; i < $scope.players.length; i++) {
              //Look by join day first
              
              var player_join_date = new Date($scope.players[i].created);
              //var join_day = player_join_date.toDateString();
              var temp = player_join_date.toISOString();//.split('T')[0];
              var join_day = temp.split('T')[0];
              //var join_day = $scope.players[i].created.split('T')[0];

              var playerID = $scope.players[i].id;

            
            for (var j = 0; j < $scope.player_events[playerID].length; j++) {
              //Then look through players
              var theEvent = $scope.player_events[playerID][j]
              var event_date = new Date(theEvent.access_time);
              var timedelta = event_date - player_join_date
              var days_later = parseInt( timedelta/(3600000*24) );
              //alert(event_date+" for join day "+player_join_date+" and days_later "+days_later+" timedelta "+timedelta);
              //Then add events to that player day.
              

              //$scope.cohort_event_count["ALL"] = {}; //[event][join_day][days_later][playerID]=count
              if(!$scope.cohort_event_count[theEvent.page_accessed]){
                  $scope.cohort_event_count[theEvent.page_accessed] = {};
                  $scope.event_list[theEvent.page_accessed] =0;
              }

              if(!$scope.cohort_event_count["ALL"][join_day]){              
                $scope.cohort_event_count["ALL"][join_day] = {};
                $scope.return_vist_count[join_day] = 0;  
              }
              if(!$scope.cohort_event_count[theEvent.page_accessed][join_day]){              
                $scope.cohort_event_count[theEvent.page_accessed][join_day] = {};
              }
              //Add for new events

              if(!$scope.cohort_event_count["ALL"][join_day][days_later]){
                $scope.cohort_event_count["ALL"][join_day][days_later] = {}; 
              }
              if(!$scope.cohort_event_count[theEvent.page_accessed][join_day][days_later]){
                $scope.cohort_event_count[theEvent.page_accessed][join_day][days_later] = {};  
              }
              
              if(!$scope.cohort_event_count["ALL"][join_day][days_later][playerID]){
                $scope.cohort_event_count["ALL"][join_day][days_later][playerID] = 0;
                if(days_later > 0){
                  //alert("Return visit sighting for "+playerID+" join_day "+join_day+" days_later "+days_later);
                  $scope.return_vist_count[join_day]+=1;
                }
              } 
              if(!$scope.cohort_event_count[theEvent.page_accessed][join_day][days_later][playerID]){
                $scope.cohort_event_count[theEvent.page_accessed][join_day][days_later][playerID] = 0;

              } 
              
              $scope.cohort_event_count["ALL"][join_day][days_later][playerID] += 1;
              $scope.cohort_event_count[theEvent.page_accessed][join_day][days_later][playerID] += 1;
              
              $scope.event_list["ALL"] +=1;
              $scope.event_list[theEvent.page_accessed] +=1;
              
            }
            
          }
            //Find the average return rate for all cohorts. 
            var total_percent = 0;
            var total_returns = 0;
            for (var cohort = 0; cohort < $scope.keys($scope.return_vist_count).length; cohort++){
              var key = $scope.keys($scope.return_vist_count)[cohort];
              var percent = $scope.return_vist_count[key]/$scope.players_by_join_day[key].length
              total_percent += percent
              total_returns += $scope.return_vist_count[key];
              //alert("cohort "+key+" count "+$scope.return_vist_count[key]+" percent "+percent);
            }
            //alert("Average % ="+total_percent/$scope.keys($scope.return_vist_count).length*100);
            $scope.average_return_rate = total_percent/$scope.keys($scope.return_vist_count).length*100;
            $scope.total_returns_percentage = total_returns/$scope.keys($scope.players).length*100;

        };  

        //Pass in offset to handel recursion and appending. 
        $scope.fetch_events_for_player = function(player,offset){
          var playerID = player.id;

          $scope.IPUser.query({'player': playerID, 'offset':offset},
                function(response) { 
                  if (offset == 0){
                    $scope.player_events[playerID] = response;
                  }else{
                    //alert(response.length);
                    $scope.player_events[playerID] = $scope.player_events[playerID].concat(response);
                    //alert("Offset "+offset+" for player ID "+playerID);
                  }
                  //else append

                  if(response.length > 99){
                    var event_date = new Date(response[99].access_time);
                    var player_join_date = new Date(player.created);
                    var timedelta = event_date - player_join_date
                    var days_later = parseInt( timedelta/(3600000*24) );
                    //alert("There were more than 99 events for player "+playerID+" and offset "+offset+" and last event is days_later="+days_later);  
                    if (days_later<14){
                      //alert("Since days_later < 14, calling recursively with offset "+(parseInt(offset)+100));
                      $scope.fetch_events_for_player(player, parseInt(offset)+100);

                    }
                    //recursive call offset + 100; 
                    
                    // if last date < player created +14 recursive. 
                    //var month_ago = new Date($scope.players[i].created);
                    //month_ago.setDate(month_ago.getDate() - 30);
                    //alert("There were more than 99 for "+playerID+" and the time was "+lastDate);
                    //Recursively call the next offset until date is before 30 days. 
                  }
                });  
        };

        
      
}

function GenericRestController($scope,$resource){
        //$scope.model = null;
        //$scope.item = null;
        //$scope.headers = null;
        $scope.items = [];
        $scope.offset = 0;
        $scope.Model = $resource('/jsonapi/rest/:model/:id');

        $scope.update_headers = function(){
          var keys = [];
          for(var key in $scope.items[0]){
            keys.push(key);
          }
          $scope.headers = keys;
        };

        $scope.update = function(id){
          $scope.UpdateResource = $resource('/jsonapi/rest/:model/:id', 
                        {"model":$scope.model, "id":id }, 
                        {'update': { method: 'PUT',    params: {} }});
          
          var item = new $scope.UpdateResource($scope.item);
          item.$update(function(response) { 
                  $scope.item = response;
                  $scope.list();
                });
        };
        
        $scope.add = function(){
          $scope.SaveResource = $resource('/jsonapi/rest/:model', 
                        {"model":$scope.model}, 
                        {'save': { method: 'POST',    params: {} }});
          var item = new $scope.SaveResource($scope.item);
          item.$save(function(response) { 
                  $scope.item = response;
                  $scope.list();
                }); 
          
        };
        
        $scope.list = function(){
          var data = {'model':$scope.model}
          $scope.Model.query(data,
                function(response) { 
                  $scope.items = response;
                  $scope.offset = $scope.items.length;
                  $scope.update_headers();
                });  
        };

        $scope.append_list = function(){

          var data = {'model':$scope.model, 'offset':$scope.offset}
          $scope.Model.query(data,
                function(response) { 
                  var temp = response;
                  $scope.items = $scope.items.concat(temp);
                  $scope.offset += temp.length;
                  $scope.update_headers();
                  //alert("items "+$scope.items.length+" offset "+$scope.offset+" length "+$scope.items.length)
                });  
        };        
                
        $scope.load = function(id){
          var data = {'model':$scope.model, 
                      'id': id
                     }
          $scope.waiting = "Loading";
          $scope.Model.get(data, 
              function(response){   
                  $scope.item = response; 
              });        
        };
        
        $scope.delete = function(id){
          var data = {'model':$scope.model,
                  'id': id
                }
          $scope.Model.remove(data, 
              function(response){
                  $scope.list();
              });
        };
        
        $scope.get_metadata = function(){
          var data = {'model':"metadata",
                 }
          $scope.Model.get(data,
                function(response) { 
                  $scope.metadata = response;
                });  
        };
}

