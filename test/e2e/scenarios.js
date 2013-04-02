'use strict';

describe('ViTech provided tests for index loaded partials', function() {
  var pauseAll = false;
  //You can load the runner with runner.html?pauseAll=true to see each page after each test.
  pauseAll = window.location.search.replace( "?pauseAll=", "" );
  
  //You can reload a page before every test if desired.
  //This can slow testing down but make test much more consistent.
  beforeEach(function() {
    browser().navigateTo('../../app/index.html');
  });


  it('should render index when user navigates to #', function() {
      
      expect(browser().location().url()).toBe("");
      //You can select all the text from all h5 or any other html element
      expect(element('h3').text()).
        toMatch("What is Singpath");
      if (pauseAll) pause();
  });

  it('should render teach when user navigates to #teach', function() {
      
      browser().navigateTo('#teach');
      
      expect(browser().location().url()).toBe("/teach");
      //You can select all the text from all h5 or any other html element
      expect(element('h2').text()).
        toMatch("This is a heading");
      if (pauseAll) pause();
  });

  it('should render create when user navigates to #create', function() {
      
      browser().navigateTo('#create');
      
      expect(browser().location().url()).toBe("/create");
      //You can select all the text from all h5 or any other html element
      expect(element('.ng-binding').text()).
        toMatch("Welcome, Ruijun!");
      if (pauseAll) pause();
  });

  it('should render home when user navigates to #home', function() {
      
      browser().navigateTo('#home');
      
      expect(browser().location().url()).toBe("/home");
      //You can select all the text from all h5 or any other html element
      expect(element('.ng-binding').text()).
        toMatch("Welcome, Ruijun!");
      if (pauseAll) pause();
  });

  it('should render profile when user navigates to #profile', function() {
      
      browser().navigateTo('#profile');
      
      expect(browser().location().url()).toBe("/profile");
      //You can select all the text from all h5 or any other html element
      expect(element('.ng-binding').text()).
        toMatch("Welcome, Ruijun!");
      if (pauseAll) pause();
  });

  it('should render storyboard when user navigates to #storyboard', function() {
      
      browser().navigateTo('#storyboard');
      
      expect(browser().location().url()).toBe("/storyboard");
      //You can select all the text from all h5 or any other html element
      expect(element('.ng-binding').text()).
        toMatch("Welcome, Ruijun!");
      if (pauseAll) pause();
  });


/*
  it('should render quests when user navigates to #quests', function() {
      
      browser().navigateTo('#quests');
      
      expect(browser().location().url()).toBe("/quests");
      //You can select all the text from all h5 or any other html element
      expect(element('h5').text()).
        toMatch("Pick a Story");
      if (pauseAll) pause();
  });
*/
/*
 it('should render practice when user navigates to #practice', function() {
      browser().navigateTo('#practice');
      expect(browser().location().url()).toBe("/practice");
      
      //Example element <ul id="sortable1" class="connectedSortable">
      //You can select by id
      expect(element('#sortable1').text()).
        toMatch("Drag from here.");
      //You can select by class
      expect(element('.connectedSortable').text()).
        toMatch("Drag from here.");
      
      if (pauseAll) pause();
  });
*/

});

describe('Play.html is loaded seappartely from index.html', function() {
  var pauseAll = false;
  //You can load the runner with runner.html?pauseAll=true to see each page after each test.
  pauseAll = window.location.search.replace( "?pauseAll=", "" );
  

  it('should render play.html', function() {
      browser().navigateTo('../../app/play.html');
      expect(browser().location().url()).toBe("");
      //You can select all the text from all h5 or any other html element
      expect(element('h3').text()).
        toMatch("Outcome");
      if (pauseAll) pause();
  });


});





