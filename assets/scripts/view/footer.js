// I know all this code is disgusting. It is a rough draft.

(function() {
  
  function Footer() {
    this.element = $('#footer');
    this.buttons = $('#tab-buttons');
    this.open = !(localStorage.footerOpen === 'false');
    this.statsTab = this.element.find('#stats-tab');
    this.settingsTab = this.element.find('#settings-tab');
    this.currentTab = 0;
    
    this.onIconChanged = null;
    this.onNameChanged = null;
    
    if (!this.open) {
      this.element.css({bottom: -256});
      $('#main-content').css({height: 'calc(100% - 88px)'})
      this.buttons.css({display: 'none', opacity: 0});
    }
    
    $('#main-content').css({
      '-webkit-transition': 'height 0.5s',
      transition: 'height 0.5s',
      '-ms-transition': 'height 0.5s'
    });
    
    var closeButton = this.element.find('#footer-close');
    closeButton.click(this.toggleOpen.bind(this));
    
    $('#stats-tab-button').click(this.showStatsTab.bind(this));
    $('#settings-tab-button').click(this.showSettingsTab.bind(this));
    
    // Temporary settings.
    $('#change-name').click(function() {
      var newName = prompt('Enter a new name for ' +
        window.app.store.getActivePuzzle().name);
      if (newName.trim() === '') {
        return;
      }
      if ('function' === typeof this.onNameChanged) {
        this.onNameChanged(newName);
      }
    }.bind(this));
    
    $('#icon-dropdown').change(function() {
      var newIcon = $('#icon-dropdown').val();
      if ('function' === typeof this.onIconChanged) {
        this.onIconChanged(newIcon);
      }
    }.bind(this));
    
    $('#scrambler-main').change(changeMenu);
    $('#scrambler-moves').change(changeMoves);
    $('#scrambler-sub').change(changeSubmenu);
  }
  
  Footer.prototype.showSettingsTab = function() {
    if (this.currentTab === 1) {
      return;
    }
    this.currentTab = 1;
    $('#stats-tab-button').attr('class', 'tab');
    $('#settings-tab-button').attr('class', 'tab-selected');
    this.settingsTab.css({display: 'block'});
    this.statsTab.css({display: 'none'});
  };
  
  Footer.prototype.showStatsTab = function() {
    if (this.currentTab === 0) {
      return;
    }
    this.currentTab = 0;
    $('#stats-tab-button').attr('class', 'tab-selected');
    $('#settings-tab-button').attr('class', 'tab');
    this.settingsTab.css({display: 'none'});
    this.statsTab.css({display: 'block'});
  };
  
  Footer.prototype.toggleOpen = function() {
    if (this.open) {
      localStorage.footerOpen = 'false';
      this.open = false;
      this.element.stop(true, true);
      this.element.animate({'bottom': -256});
      this.buttons.animate({opacity: 0}, {complete: function() {
        this.buttons.css({display: 'none'});
      }.bind(this)});
      $('#main-content').css({height: 'calc(100% - 88px)'})
    } else {
      localStorage.footerOpen = 'true';
      this.open = true;
      this.element.stop(true, true);
      this.element.animate({'bottom': 0});
      this.buttons.css({display: 'block'});
      this.buttons.animate({opacity: 1});
      $('#main-content').css({height: 'calc(100% - 344px)'})
    }
  };
  
  Footer.prototype.updateSettings = function() {
    var current = window.app.store.getActivePuzzle();
    this.element.find('#settings-tab .puzzle label').text(current.name);
    this.element.find('#settings-tab .puzzle img').attr('src',
      'images/puzzles/' + current.icon + '.png');
    this.element.find('#icon-dropdown').val(current.icon);
    
    $('#scrambler-main').val(current.scrambler);
    populateSubmenu();
  };
  
  function changeMenu() {
    var current = window.app.store.getActivePuzzle();
    
    var menuName = $('#scrambler-main').val();
    if (menuName == 'None') {
      window.app.store.changePuzzle({scrambler: 'None'}, function() {
        window.app.flow.showScramble();
      });
      $('#scrambler-sub').css({display: 'none'});
      $('#scrambler-moves').css({display: 'none'});
      return;
    }
    
    var scramblers =
      window.puzzlejs.scrambler.scramblersForPuzzle(menuName);
    window.app.store.changePuzzle({scrambler: menuName, scrambleLength: 25,
      scrambleType: scramblers[0].name}, function() {
      populateSubmenu();
      window.app.flow.showScramble();
    });
  }
  
  function changeMoves() {
    var count = parseInt($('#scrambler-moves').val());
    if (isNaN(count)) {
      count = 25;
      $('#scrambler-moves').val(count);
    }
    window.app.store.changePuzzle({scrambleLength: count}, function() {
      window.app.flow.showScramble();
    });
  }
  
  function changeSubmenu() {
    var current = window.app.store.getActivePuzzle();
    var scramblers =
      window.puzzlejs.scrambler.scramblersForPuzzle(current.scrambler);
    var submenuName = $('#scrambler-sub').val();
    for (var i = 0, len = scramblers.length; i < len; ++i) {
      var scrambler = scramblers[i];
      if (scrambler.name !== submenuName) {
        continue;
      }
      if (!scrambler.moves) {
        $('#scrambler-moves').css({display: 'none'});
      } else {
        $('#scrambler-moves').css({display: 'inline-block'});
        $('#scrambler-moves').val(25);
      }
    }
    window.app.store.changePuzzle({scrambleType: submenuName,
      scrambleLength: 25}, function() {
      window.app.flow.showScramble();
    });
  }
  
  function populateSubmenu() {
    var current = window.app.store.getActivePuzzle();
    
    if (current.scrambler === 'None') {
      $('#scrambler-sub').css({display: 'none'});
      $('#scrambler-moves').css({display: 'none'});
      return;
    }
    
    // Setup the sub menu
    var subMenu = $('#scrambler-sub');
    subMenu.html('');
    var scramblers =
      window.puzzlejs.scrambler.scramblersForPuzzle(current.scrambler);
    for (var i = 0, len = scramblers.length; i < len; ++i) {
      var scrambler = scramblers[i];
      var option = $('<option name="' + scrambler.name + '">' +
        scrambler.name + '</options>');
      subMenu.append(option);
      if (scrambler.name === current.scrambleType) {
        if (!scrambler.moves) {
          $('#scrambler-moves').css({display: 'none'});
        } else {
          $('#scrambler-moves').css({display: 'inline-block'});
          $('#scrambler-moves').val(current.scrambleLength);
        }
      }
    }
    subMenu.css({display: 'inline-block'});
    subMenu.val(current.scrambleType);
  }
  
  if (!window.app) {
    window.app = {};
  }
  window.app.Footer = Footer;
  
})();