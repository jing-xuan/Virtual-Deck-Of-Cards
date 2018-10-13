var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
   res.sendFile(__dirname + '\\views\\index.html');
});

app.get('/connectroom/', function(req, res){
  res.render('cards.ejs', {data: req.query['roomID']});
});

io.on('connection', function(socket) {
   socket.on('connectRoom', function(room){
     socket.join(room);
     io.sockets.in(room).emit('connectToRoom', 'Deck ' + room + ' There are ' + io.sockets.adapter.rooms[room].length + ' people here');
   })

   socket.on('getDeck', function(data){
     var deck = newDeck(data['jokers']);
     io.sockets.in(data['room']).emit('giveDeck', deck);
   })

   socket.on('takeCards', function(data){
     cards = takeCards(data[0]['numCards'], data[0]['deck'], data[0]['mycards']);
     io.to(data[0]['user']).emit('getCards', cards['mycards']);
     io.sockets.in(data[0]['room']).emit('giveDeck', cards['deck']);
   })

   socket.on('shuffleDeck', function(data){
     io.sockets.in(data['room']).emit('giveDeck', shuffleDeck(data['deck'], data['deck'].length));
   })

   socket.on('addPile', function(data){
     data['pile'].push([]);
     console.log(data);
     io.sockets.in(data['room']).emit('addedPile', data['pile']);
   })

   socket.on('moveCard', function(data){
     console.log(data);
     data['pile'][data['pileIndex']].push(data['card']);
     console.log(data['pile']);
     io.sockets.in(data['room']).emit('movedCard', data['pile']);
   })
});

function newDeck(jokers) {
  var rank = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var suit = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
  var cards = [];
  for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 13; j++) {
      var card = {"rank" : rank[j], "suit" : suit[i], "reveal" : '0'};
      cards.push(card);
    }
  }
  if (jokers == '1') {
    cards.push({'rank' : 'Joker', "suit" : "red", "reveal" : '0'});
    cards.push({'rank' : 'Joker', "suit" : "black", "reveal" : '0'});
  }
  return cards;
}

function takeCards(numcards, deck, mydeck) {
  for (var i = 0; i < numcards; i++) {
    mydeck.push(deck[0]);
    deck.splice(0, 1);
  }
  data = {"mycards" : mydeck, "deck" : deck};
  return data;
}

function shuffleDeck(deck, num) {
  var shuffledDeck = [];
  for (var i = num - 1; i > -1; i--) {
    var index = Math.floor(Math.random() * i);
    shuffledDeck.push(deck[index]);
    deck.splice(index, 1);
  }
  return shuffledDeck
}

http.listen(3000, function() {
   console.log('listening on localhost:3000');
});
