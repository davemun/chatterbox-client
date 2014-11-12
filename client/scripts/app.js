var app = {
  server: 'https://api.parse.com/1/classes/chatterbox',
  init: function(){
    this.dataStorage = {};
    this.mostRecent = undefined;
    this.friends = [];
    this.username;
  },
  send: function(message){
    $.ajax({
      // always use this url
      url: this.server,
      type: 'POST',
      data: JSON.stringify(message),
      contentType: 'application/json',
      success: function (data) {
        console.log('chatterbox: Message sent');
        $('.submit').find('.text').val('');
      },
      error: function (data) {
        // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
        console.error('chatterbox: Failed to send message');
      }
    });
  },
  fetch: function(){
    var data = { order: '-createdAt' };
    if(app.mostRecent){
      data.where = JSON.stringify({'updatedAt': {'$gt': {"__type": "Date","iso": app.mostRecent}}});
      data.limit = 1000;
    }
    
    $.ajax({
      // always use this url
      url: app.server,
      type: 'GET',
      data: data,
      contentType: 'application/json',
      success: function (data) {
        console.log(data.results);
        if (data.results[0]) {
          app.mostRecent = data.results[0].updatedAt;
        }

        data.results = data.results.reverse();
        _.each(data.results, function(msg){
          msg.roomname = msg.roomname || 'lobby'; //defaults to lobby if no roomname is set
          if (!app.dataStorage[msg.roomname]) { //unique room name list
            app.makePanel(msg.roomname);
            app.dataStorage[msg.roomname] = 1;
          }else{
            app.dataStorage[msg.roomname] = app.dataStorage[msg.roomname]+1;
          }

          app.addMessage(msg);
        });
      },
      error: function (data) {
        // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
        console.error('chatterbox: Failed to fetch messages');
      }
    });
  },
  clearMessages: function(){
    $('#chats').html("");
  },

  sanitize: function(str){
    return str.replace(/\s/g,'-').replace(/[^a-zA-Z0-9-]+/g,'');
  },

  addMessage: function(message){
    var usernameLink = $("<a href='#' class='username'></a>").text(message.username);
    var username = $("<span></span>").html(usernameLink);
    var text = $("<span></span>").text(message.text);
    var msg = $("<li></li>").append(username).append(': ').append(text);
    msg.addClass(this.sanitize(message.username || 'anonymous'));

    if (this.friends.indexOf(message.username) > -1) {
      msg.addClass('friend');
    }

    $('#panel-element-' + app.sanitize(message.roomname)).find('.panel-body').prepend(msg);
    var node = $('#panel-element-' + app.sanitize(message.roomname)).parent();
    //color notifications -> app.init to remove
    if(node.hasClass("panel-default")){
      node.removeClass("panel-default").addClass("panel-success");
    };
    node.find('.panel-title').text( app.sanitize(message.roomname)+" ("+app.dataStorage[message.roomname]+")")
      //^changes ALL nodes because that is not a unique identifier - need a way to traverse up, and then back down to proper node heading.
  },

  addRoom: function(roomName){
    var room = $("<div></div>");
    $('#roomSelect').append(room);
  },

  addFriend: function(username){
    if(app.friends.indexOf(username) > -1){
      return;
    }
    this.friends.push(username);
    var friendMessages = $('.' + this.sanitize(username));
    console.log(friendMessages);
    friendMessages.addClass('friend');
    //integrate into friendsList
    $('#panel-friendsList').find('.panel-body').append($('<li></li>').text(username).addClass("friendsListUserName"));
    $('#panel-friendsList').find('#panel-friends-title').text("Friends List (" + String(app.friends.length) + ")");
        console.log('addFriend was called');
  },

  handleSubmit: function(username, text, roomname){
    if(text){
      this.send({
        'username': app.username,
        'text': text,
        'roomname': roomname
      });
    } else {
      alert('Fill it out, dummy!');
    }
  },

  makePanel: function(roomName){
    var template = $('#panel-template').clone().removeAttr('id');
    template.find('.panel-title').addClass("roomnameClick").attr("href", "#panel-element-" + app.sanitize(roomName)).text(roomName);
    template.find('.panel-collapse').attr("id", "panel-element-" + app.sanitize(roomName)).attr("class", "collapse");
    $('#panel-380907').append(template);
  }


};

//Event Handlers
$(function() {
  app.init();

  $('#main').on('click', '.username', function(event) {
    event.preventDefault();
    app.addFriend($(this).text());
  });

  $('#send .submit').on('submit', function(event){
    event.preventDefault();
    app.handleSubmit($('.username').val(), $('.text').val(), $('.roomname').val());
  });

  $('#main').on('click', '#retrieveMessages', function(){
    app.fetch();
  });

  $('#main').on('click', '.friendsListUserName', function(){
    $('.submit').find('.roomname').val($(this).text());
  });

  $('#main').on('click', '.roomnameClick', function(){
    var $panel = $(this).closest('.panel');
    if( $panel.hasClass("panel-success") ){
      $panel.removeClass("panel-success").addClass("panel-default");
    };
  });

  app.username = window.location.search.slice(10);

  app.fetch();
  setInterval(app.fetch, 2000);
});
