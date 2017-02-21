/*jslint browser:true, plusplus:true, bitwise:true*/
/*global WebSocket, $, singlesitenav, console, enums, alert,  confirm, deckEditor, FileReader, databaseSystem*/




var sound = {};

var internalLocal = internalLocal;

var livingIn2017 = true;
(function () {
    'use strict';
    sound.play = function (targetID) {

        document.getElementById(targetID).play();
    };
}());

function penR() {
    'use strict';
    return (livingIn2017) ? 7 : 4;
}

function penL() {
    'use strict';
    return (livingIn2017) ? 6 : 0;
}

function setMidSchool(set) {
    'use strict';
    livingIn2017 = set;
    if (set) {
        $('.field').css('background-image', "url(http://ygopro.us/img/textures/field.png)");
    } else {
        $('.field').css('background-image', "url(http://ygopro.us/img/textures/field.png)");
    }
}

var manualServer,
    broadcast,
    activegame,
    duelstarted = false,
    orientSlot = 0,
    manualActionReference,
    attributeMap = {
        1: "EARTH",
        2: "WATER",
        4: "FIRE",
        8: "WIND",
        16: "LIGHT",
        32: "DARK",
        64: "DIVINE"
    },
    stMap = {
        2: '',
        4: '',
        130: " / Ritual",
        65538: " / Quick-Play",
        131074: " / Continuous",
        131076: " / Continuous",
        262146: " / Equip",
        1048580: " / Counter"
    },
    fieldspell = {
        524290: " / Field"
    },
    monsterMap = {
        17: "Normal",
        33: "Effect",
        65: "Fusion",
        97: "Fusion / Effect",
        129: "Ritual",
        161: "Ritual / Effect",
        545: "Spirit",
        1057: "Union",
        2081: "Gemini / Effect",
        4113: "Tuner",
        4129: "Tuner / Effect",
        8193: "Synchro",
        8225: "Synchro / Effect",
        12321: "Synchro / Tuner / Effect",
        2097185: "Flip / Effect",
        4194337: "Toon / Effect",
        8388609: "Xyz",
        8388641: "Xyz / Effect",
        16777233: "Pendulum",
        16777249: "Pendulum / Effect",
        16781345: "Pendulum / Tuner / Effect",
        25165857: "Xyz / Pendulum / Effect",
        33554433: "Link",
        33554465: "Link / Effect"
    },
    pendulumMap = {
        16777233: "Pendulum",
        16777249: "Pendulum / Effect",
        16781345: "Pendulum / Tuner / Effect",
        25165857: "Xyz / Pendulum / Effect"
    },
    raceMap = {
        1: "Warrior",
        2: "Spellcaster",
        4: "Fairy",
        8: "Fiend",
        16: "Zombie",
        32: "Machine",
        64: "Aqua",
        128: "Pyro",
        256: "Rock",
        512: "Winged-Beast",
        1024: "Plant",
        2048: "Insect",
        4096: "Thunder",
        8192: "Dragon",
        16384: "Beast",
        32768: "Beast-Warrior",
        65536: "Dinosaur",
        131072: "Fish",
        262144: "Sea-Serpent",
        524288: "Reptile",
        1048576: "Psychic",
        2097152: "Divine-Beast",
        4194304: "Creator God",
        8388608: "Wyrm",
        16777216: "Cybers"
    };

function cardIs(cat, obj) {
    'use strict';
    if (cat === "monster" && (obj.race !== 0 || obj.level !== 0 || obj.attribute !== 0)) {
        return true;
    }
    if (cat === "monster") {
        return (obj.type & 1) === 1;
    }
    if (cat === "spell") {
        return (obj.type & 2) === 2;
    }
    if (cat === "trap") {
        return (obj.type & 4) === 4;
    }
    if (cat === "fusion") {
        return (obj.type & 64) === 64;
    }
    if (cat === "synchro") {
        return (obj.type & 8192) === 8192;
    }
    if (cat === "xyz") {
        return (obj.type & 8388608) === 8388608;
    }
    if (cat === "link") {
        return (obj.type & 33554432) === 33554432;
    }
}


var avatarMap = {};


function scaleScreenFactor() {
    'use strict';
    var requiredRes = 2500;
    var sideBarSize = 508,
       actualRequiredRes = requiredRes - sideBarSize;
        scale = ($(window).height() / actualRequiredRes);
    $('.field').css('transform', 'scale(' + scale + ')');
    return scale;
}

function getAvatar(name) {
    'use strict';
    if (avatarMap[name]) {
        return;
    }
    $.getJSON('http://forum.ygopro.us/avatar.php?username=' + name, function processAvatar(avatarUnit) {
        avatarMap[name] = 'http://forum.ygopro.us/uploads/' + avatarUnit.url;
    });
}

function updateloby(state) {
    'use strict';
    if (state === undefined) {
        return;
    }
    $('#player1lobbyslot').val(state.player[0].name);
    $('#player2lobbyslot').val(state.player[1].name);
    //    $('#player3lobbyslot').val(state.player[2].name);
    //    $('#player4lobbyslot').val(state.player[3].name);
    $('#slot1 .lockindicator').attr('data-state', state.player[0].ready);
    $('#slot2 .lockindicator').attr('data-state', state.player[1].ready);
    //    $('#slot3 .lockindicator').attr('data-state', state.player[2].ready);
    //    $('#slot4 .lockindicator').attr('data-state', state.player[3].ready);
    $('#lobbytimelimit').text(state.timelimit + ' seconds');
    $('#lobbyflist').text(state.banlist);
    $('#lobbylp').text(state.startLP);
    $('#lobbycdpt').text(state.drawcount);
    $('#lobbyallowed').text($('#creategamecardpool option').eq(state.rule).text());
    $('#lobbygamemode').text($('#creategameduelmode option').eq(state.mode).text());
    if (state.ishost) {
        $('#lobbystart').css('display', 'inline-block');
    } else {
        $('#lobbystart').css('display', 'none');
    }

    if ($('#creategameduelmode option').eq(state.mode).text() === 'Tag') {
        $('.slot').eq(2).css('display', 'block');
        $('.slot').eq(3).css('display', 'block');
    } else {
        $('.slot').eq(2).css('display', 'none');
        $('.slot').eq(3).css('display', 'none');
    }
    getAvatar(state.player[0].name);
    getAvatar(state.player[1].name);
    setTimeout(function () {
        $('#p0avatar').attr('src', avatarMap[state.player[0].name]);
        $('#p1avatar').attr('src', avatarMap[state.player[1].name]);
        $('.p0name').html(state.player[0].name);
        $('.p1name').html(state.player[1].name);
    }, 3000);


}

var sidedDeck = {};


function makeSideCard(cards, zone) {
    'use strict';
    var html = '';


    cards.forEach(function (card, index) {
        var hardcard = JSON.stringify(card),
            src = card + '.jpg';
        html += '<img class="sidedeckzonecard" src="https://rawgit.com/SalvationDevelopment/YGOPro-Images/master/' + src + '" data-"' + card + '" onclick = "sideonclick(' + index + ', \'' + zone + '\')" / > ';
    });

    $('.sidingzone .' + zone).html(html);
    //$('#subreveal').width(cards.length * 197);
}

function renderSideDeckZone(deck) {
    'use strict';
    makeSideCard(deck.main, 'main');
    makeSideCard(deck.extra, 'extra');
    makeSideCard(deck.side, 'side');

    var floatMarkerMain = '',
        floatMarkerExtra = 's' + deck.extra.length,
        floatMarkerSide = 's' + deck.side.length;

    if (deck.main.length > 40) {
        floatMarkerMain = 's50';
    }
    if (deck.main.length > 59) {
        floatMarkerMain = 's60';
    }






    $('.sidingzone .main').attr('floatmarker', floatMarkerMain);
    $('.sidingzone .extra').attr('floatmarker', floatMarkerExtra);
    $('.sidingzone .side').attr('floatmarker', floatMarkerSide);
}




function startSiding() {
    'use strict';
    $('#automationduelfield').html('');
    $('.field').addClass('sidemode');
    $('.sidingzone').addClass('sidemode');
    $('#ingamesidebutton').css('display', 'none');
    $('#ingamexsidebutton').css('display', 'block');

}

function makeGames() {
    'use strict';
    $('#manualgamelistitems').html('');
    Object.keys(broadcast).forEach(function (gameName) {

        var game = broadcast[gameName],
            player1 = game.player[0].name || '___',
            player2 = game.player[1].name || '___',
            players = player1 + ' vs ' + player2,
            started = (game.started) ? 'started' : '',
            action = (game.started) ? '' : 'onclick = "manualJoin(\'' + gameName + '\')"',
            string = '<div class="manualgame ' + started + '" ' + action + '>' + players + '</div>';
        $('#manualgamelistitems').append(string);
    });
}

var uploadedDeck = '';





function getdeck() {
    'use strict';

    function getter(card) {
        return Number(card.id);
    }
    var selection = $('#lobbycurrentdeck .currentdeck').val() || 0,
        deck = deckEditor.getDeck(selection),
        main = deck.main.map(getter),
        side = deck.side.map(getter),
        extra = deck.extra.map(getter);

    return {
        main: main,
        side: side,
        extra: extra
    };
}

function loadField() {
    'use strict';
    $('#duelzone').css('display', 'block');
}

var manualDuel,
    targetreference,
    attackmode = false,
    targetmode = false,
    overlaymode = false;

function stateUpdate(dataBinding) {
    'use strict';
    var fieldings,
        offsetX,
        offsetY,
        field = $('#automationduelfield'),
        element = dataBinding.element,
        player,
        ref = dataBinding,
        face = Boolean(element.attr('data-position').indexOf('FaceDown') > -1 || !ref.id);


    if (orientSlot) {
        player = (dataBinding.player === 1) ? 0 : 1;
    } else {
        player = dataBinding.player;
    }
    if (orientSlot) {
        player = (dataBinding.player === 1) ? 0 : 1;
    } else {
        player = dataBinding.player;
    }
    fieldings = 'card p' + player + ' ' + ref.location + ' i' + ref.index;

    if (fieldings !== element.attr('class') || ref.position !== element.attr('data-position') || String(ref.id) !== element.attr('data-id')) {

        element.attr({
            'class': fieldings,
            'data-position': ref.position,
            'data-id': ref.id,
            'data-uid': ref.uid,
            'src': (ref.id) ? 'https://rawgit.com/SalvationDevelopment/YGOPro-Images/master/' + ref.id + '.jpg' : 'img/textures/cover.jpg'
        });

        element.attr('style', 'z-index:' + (ref.index));
        element.attr('data-index', ref.index);
        if (ref.location === 'MONSTERZONE' && ref.overlayindex) {
            offsetX = (ref.overlayindex % 2) ? (-1) * (ref.overlayindex + 1) * 3 : ref.overlayindex + (-1) * 3;
            offsetY = ref.overlayindex * 4;
            element.attr('style', 'z-index: -' + ref.overlayindex + '; transform: translate(' + offsetX + 'px, ' + offsetY + 'px)');
        }
        if (ref.counters > 0) {
            $('.cardselectionzone.p' + player + '.' + ref.location + '.i' + ref.index).attr('data-counters', ref.counters + ' Counters').attr('style', 'z-index:' + (ref.index + 1));
        } else {
            $('.cardselectionzone.p' + player + '.' + ref.location + '.i' + ref.index).removeAttr('data-counters').attr('style', 'z-index:' + ref.index + ';');
        }


    }
    if (attackmode) {
        $('.p1').addClass('attackglow');
    }

}

function linkStack(field) {
    'use strict';
    console.log('field:', field);
    scaleScreenFactor();


    function linkgui(zone) {
        zone.forEach(function (card) {
            var idIndex = manualDuel.uidLookup(card.uid),
                unit = manualDuel.stack[idIndex];
            Object.keys(unit).forEach(function (prop) {
                if (card[prop] !== undefined) {
                    unit[prop] = card[prop];
                }
            });
        });

    }

    Object.keys(field[0]).forEach(function (zone) {
        linkgui(field[0][zone]);
    });
    Object.keys(field[1]).forEach(function (zone) {
        linkgui(field[1][zone]);
    });
    manualDuel.stack.forEach(stateUpdate);
}

function Card(movelocation, player, index, unique) {
    'use strict';
    return {
        type: 'card',
        player: player,
        location: movelocation,
        id: 0,
        index: index,
        position: 'FaceDown',
        overlayindex: 0,
        uid: unique,
        counters: 0

    };
}

function layouthand(player) {
    'use strict';
    var count = $('.p' + player + '.HAND').length,
        f = 75 / 0.8,
        xCoord,
        sequence;
    //    console.log(count,f,xCoord);
    for (sequence = 0; sequence < count; sequence++) {
        if (count < 6) {
            xCoord = (5.5 * f - 0.8 * f * count) / 2 + 1.55 * f + sequence * 0.8 * f;
        } else {
            xCoord = 1.9 * f + sequence * 4.0 * f / (count - 1);
        }
        // console.log('.'+player+'.Hand.i'+sequence);
        //console.log(xCoord);
        $('.p' + player + '.HAND.i' + sequence).css('left', String() + xCoord + 'px');
    }
}




function orient(player) {
    'use strict';
    if (orientSlot) {
        return (player === 1) ? 0 : 1;
    }
    return player;

}

function guiCard(dataBinding) {
    'use strict';

    var field = $('#automationduelfield'),
        element,
        player;

    if (orientSlot) {
        player = (dataBinding.player === 1) ? 0 : 1;
    } else {
        player = dataBinding.player;
    }
    $(field).append('<img onclick="return guicardonclick()" id="uid' + dataBinding.uid + '" class="card p' + player + ' ' + dataBinding.location + ' i' + dataBinding.index + ' o" src="img/textures/cover.jpg" data-position="FaceDown" onError="this.onerror=null;this.src=\'/img/textures/unknown.jpg\';" />');
    element = $('#uid' + dataBinding.uid);
    return element;

}



function cardmargin(player, deck) {
    'use strict';
    var multi = (deck === 'GRAVE') ? -1 : 1;
    $('.card.p' + player + '.' + deck).each(function (i) {
        var n = $(this).attr('data-index');
        $(this).attr('style', '').css({
            '-webkit-transform': 'translate3d(0,0,' + n + 'px)',
            'z-index': (n * multi)
        });
    });
}

function initGameState() {
    //the field is represented as a bunch of cards with metadata in an array, <div>card/card/card/card</div>
    //numberOfCards is used like a memory address. It must be increased by 1 when creating a new card.
    'use strict';
    var stack = [],
        playerLP = [];


    //various query filters for doing various things.
    function filterIsCard(array) {
        return array.filter(function (item) {
            return item.type === 'card';
        });
    }

    function filterPlayer(array, player) {
        return array.filter(function (item) {
            return item.player === player;
        });
    }

    function filterlocation(array, location) {
        return array.filter(function (item) {
            return item.location === location;
        });
    }

    function filterIndex(array, index) {
        return array.filter(function (item) {
            return item.index === index;
        });
    }

    function filterOverlyIndex(array, overlayindex) {
        return array.filter(function (item) {
            return item.overlayindex === overlayindex;
        });
    }

    function newCard() {
        stack.push(new Card('TOKEN', 0, 0, stack.length));
        stack[stack.length - 1].element = guiCard(stack[stack.length - 1]);
    }

    function filterUID(stack, uid) {
        return stack.filter(function (item) {
            return item.uid === uid;
        });
    }

    //the way the stack of cards is setup it requires a pointer to edit it.
    function uidLookup(uid) {
        var i;
        for (i = 0; stack.length > i; i++) {
            if (stack[i].uid === uid) {
                return i;
            }
        }
    }

    function removeCard(uid) {
        var target = filterUID(stack, uid)[0],
            pointer = uidLookup(target.uid);

        delete stack[pointer];
    }

    //exposed method to initialize the field;
    function startDuel(OneDeck, TwoDeck, OneExtra, TwoExtra) {
        var i;


        for (i = 0; OneExtra > i; i++) {
            stack.push(new Card('EXTRA', 0, i, stack.length));
        }
        for (i = 0; TwoExtra > i; i++) {
            stack.push(new Card('EXTRA', 1, i, stack.length));
        }
        for (i = 0; OneDeck > i; i++) {
            stack.push(new Card('DECK', 0, i, stack.length));
        }
        for (i = 0; TwoDeck > i; i++) {
            stack.push(new Card('DECK', 1, i, stack.length));
        }
        for (i = 0; stack.length > i; i++) {
            stack[i].element = guiCard(stack[i]);
        }
        cardmargin('0', 'GRAVE');
        cardmargin('0', 'HAND');
        cardmargin('0', 'EXTRA');
        cardmargin('0', 'DECK');
        cardmargin('1', 'DECK');
        cardmargin('1', 'GRAVE');
        cardmargin('1', 'HAND');
        cardmargin('1', 'EXTRA');
        console.log('stack', stack, OneDeck, TwoDeck, OneExtra, TwoExtra);
    }



    //returns info on a card.
    function queryCard(player, clocation, index, overlayindex) {
        return filterOverlyIndex(filterIndex(filterlocation(filterPlayer(stack, player), clocation), index), overlayindex);
    }


    return {
        removeCard: removeCard,
        startDuel: startDuel,
        uidLookup: uidLookup,
        stack: stack,
        newCard: newCard
    };
}

function manualgamestart(message) {
    'use strict';
    var l1 = message.info.lifepoints[0],
        l2 = message.info.lifepoints[1],
        main1 = (Array.isArray(message.field[0].DECK)) ? message.field[0].DECK.length : message.field[0].DECK,
        main2 = (Array.isArray(message.field[1].DECK)) ? message.field[1].DECK.length : message.field[1].DECK,
        extra1 = (Array.isArray(message.field[0].EXTRA)) ? message.field[0].EXTRA.length : message.field[0].EXTRA,
        extra2 = (Array.isArray(message.field[1].EXTRA)) ? message.field[1].EXTRA.length : message.field[1].EXTRA;
    singlesitenav('duelscreen');
    if (!duelstarted || !window.manualDuel) {
        loadField();
        duelstarted = true;
        window.manualDuel = initGameState();
        window.manualDuel.startDuel(main1, main2, extra1, extra2);
    }

}



function guishuffle(player, deck) {
    'use strict';
    var orientation = (player === 'p0') ? ({
        x: 'left',
        y: 'bottom',
        direction: 1
    }) : ({
        x: 'right',
        y: 'top',
        direction: -1
    });
    cardmargin(player, deck);
    $($('.card.' + player + '.' + deck).get().reverse()).each(function (i) {
        var cache = $(this).css(orientation.x),
            spatical = Math.floor((Math.random() * 100) - 50);
        $(this).css(orientation.x, '-=' + spatical + 'px');
    });

}

function doGuiShuffle(player, deck) {
    'use strict';
    var action = setInterval(function () {
        guishuffle('p' + player, deck);
        setTimeout(function () {
            cardmargin(String() + player, deck);
        }, 50);
    }, 200);
    setTimeout(function () {
        clearInterval(action);
        cardmargin(String() + player, deck);
        setTimeout(function () {
            layouthand(player);
        }, 500);

    }, 1000);
    guishuffle('p' + player, deck);
}

function excludeTokens(card) {
    // filter out Tokens
    'use strict';
    if (card.type === 16401 || card.type === 16417) {
        return false;
    }
    return true;
}



function getCardObject(id) {
    'use strict';
    var result = {};
    databaseSystem.getDB().some(function (card, index) {
        if (id === card.id) {
            result = card;
            return true;
        } else {
            return false;
        }
    });

    return result;
}

function automaticZonePicker(realPlayer, zone) {
    'use strict';
    var player = orient(realPlayer),
        result,
        safe;
    if (manualActionReference) {
        safe = false;
    } else {
        safe = cardIs('xyz', getCardObject(parseInt(manualActionReference.id, 10)));
    }

    if ($('#automationduelfield .p' + player + '.' + zone + '.i2').length < 1) {
        result = 2; //1
    } else if ($('#automationduelfield .p' + player + '.' + zone + '.i1').length < 1) {
        result = 1; //2
    } else if ($('#automationduelfield .p' + player + '.' + zone + '.i3').length < 1) {
        result = 3; //3
    } else if ($('#automationduelfield .p' + player + '.' + zone + '.i4').length < 1) {
        result = 4; //5
    } else if ($('#automationduelfield .p' + player + '.' + zone + '.i0').length < 1) {
        result = 0; //4
    }

    if (result === undefined && !safe) {
        throw new Error();
    } else if (result === undefined && safe) {
        return 1;
    }
    return result;

}

var revealcache = [],
    pasedReveal,
    revealcacheIndex = 0;

function reveal(cards, note) {
    'use strict';
    var html = '';
    revealcache = [];
    $('#revealedclose').css('display', 'block');
    $('#revealed').css('display', 'flex');
    if (cards.length > 5) {
        html += "<div id='subreveal'>";
        $('#revealed').css('display', 'block');
    }
    cards.forEach(function (card, index) {
        var hardcard = JSON.stringify(card),
            src = (card.id) ? 'https://rawgit.com/SalvationDevelopment/YGOPro-Images/master/' + card.id + '.jpg' : 'img/textures/cover.jpg';
        revealcache.push(card);
        html += '<img id="revealuid' + card.uid + '" class="revealedcard" src="' + src + '" data-id="' + card.id + '" onclick = "revealonclick(' + index + ', \'' + note + '\')" data-uid="' + card.uid + '" / > ';
    });
    if (cards.length > 5) {
        html += "</div>";
    }
    $('#revealed').html(html);
    //$('#subreveal').width(cards.length * 197);
}

var chatplace = 0;

function updateChat(duelist, spectators) {
    'use strict';
    if (duelist) {
        $('.ingamechatbox').html('');

        duelist.forEach(function (chatMessage, index) {
            $('.ingamechatbox').append('<li>' + chatMessage + '</li>');
        });
    }
    if (spectators) {
        $('#spectatorchattext').html('');
        spectators.forEach(function (chatMessage, index) {
            $('#spectatorchattext').append('<li>' + chatMessage + '</li>');
        });
    }

    $('.ingamechatbox, #sidechat, #spectatorchattext').scrollTop($('.ingamechatbox').prop("scrollHeight"));
}

var duelstash = {},
    sidestach = {};


function endSiding() {
    'use strict';

    if (sidedDeck.side.length !== sidestach.side) {
        alert('Side Deck is not at orginal amount of', sidestach.side);
        return;
    }
    manualServer.send(JSON.stringify({
        action: 'lock',
        deck: sidedDeck,
        side: true
    }));
    setTimeout(function () {
        if (broadcast[activegame].player[0].ready && broadcast[activegame].player[1].ready) {
            manualServer.send(JSON.stringify({
                action: 'start'
            }));
            return;
        } else {
            alert('Opponent is still siding, please wait.');
        }
    }, 2000);
}

function startGame(message) {
    'use strict';
    $('#automationduelfield').html(' ');
    $('#ingamesidebutton').css('display', 'none');
    $('.field').removeClass('sidemode');
    $('.sidingzone').removeClass('sidemode');
    $('#ingamesidebutton').css('display', 'none');
    $('#ingamexsidebutton').css('display', 'none');
    window.manualDuel = {};
    duelstarted = false;
    manualgamestart(message);
    //startDuel(player1StartLP, player2StartLP, OneDeck, TwoDeck, OneExtra, TwoExtra)
    linkStack(message.field);


    $('#phaseindicator').attr('data-currentphase', message.info.phase);
    $('.p0lp').val(message.info.lifepoints[0]);
    $('.p1lp').val(message.info.lifepoints[1]);
    setTimeout(function () {
        cardmargin(0, 'GRAVE');
        cardmargin(0, 'EXTRA');
        cardmargin(0, 'DECK');
        cardmargin(1, 'GRAVE');
        cardmargin(1, 'EXTRA');
        cardmargin(1, 'DECK');
        layouthand(0);
        layouthand(1);
        $('#sidechatinput').focus();
        sound.play('soundcardShuffle');
    }, 1000);
    updateChat(message.info.duelistChat);
    internalLocal = 'duelscreen';
}

function manualReciver(message) {
    'use strict';

    if (message.info !== undefined) {
        updateChat(message.info.duelistChat, message.info.spectatorChat);
    }
    if (broadcast) {
        if (activegame) {
            updateloby(broadcast[activegame]);
        }

    }
    console.log(message);
    if (message.error) {
        if (internalLocal === 'surrendered') {
            alert('An Error Occured');
        }

    }

    switch (message.action) {
    case "ack":
        manualServer.send(JSON.stringify({
            action: 'ack',
            game: activegame
        }));
        break;
    case "register":
        manualServer.send(JSON.stringify({
            action: 'register',
            name: localStorage.nickname
        }));
        break;
    case "lobby":
        singlesitenav('lobby');
        activegame = message.game;
        updateloby(broadcast[activegame]);
        break;
    case "broadcast":
        broadcast = message.data;
        if (activegame) {
            updateloby(broadcast[activegame]);
        }
        makeGames();
        break;
    case "sound":
        sound.play(message.sound);
        break;
    case "slot":
        orientSlot = message.slot;
        break;
    case "target":
        $('.attackglow').removeClass('attackglow');
        $('.card.p' + orient(message.target.player) + '.' + message.target.location + '.i' + message.target.index).addClass('attackglow');
        break;
    case "attack":
        $('#attackanimation').remove();
        $('#automationduelfield').append('<img  id="attackanimation" class="card p' + orient(message.source.player) + ' ' + message.source.location + ' i' + message.source.index + '" src="img/textures/attack.png" data-orient="' + orient(message.source.player) + '" />');
        setTimeout(function () {
            $('#attackanimation').attr('class', 'card p' + orient(message.target.player) + ' ' + message.target.location + ' i' + message.target.index);
            $('.card.p' + orient(message.target.player) + '.' + message.target.location + '.i' + message.target.index).addClass('attackglow');
            $('.card.p' + orient(message.source.player) + '.' + message.source.location + '.i' + message.source.index).addClass('attackglow');
        }, 1000);
        setTimeout(function () {
            $('#attackanimation').remove();
            $('.attackglow').removeClass('attackglow');
        }, 3000);
        break;
    case "side":
        $('#ingamesidebutton').css('display', 'block');
        sidedDeck = message.deck;
        sidedDeck.main.sort();
        sidedDeck.extra.sort();
        sidedDeck.side.sort();
        sidestach.main = sidedDeck.main.length;
        sidestach.extra = sidedDeck.extra.length;
        sidestach.side = sidedDeck.side.length;
        renderSideDeckZone(sidedDeck);
        break;
    case "start":
        startGame(message);
        break;
    case "newCard":
        window.manualDuel.newCard();
        linkStack(message.field);
        setTimeout(function () {
            cardmargin(0, 'GRAVE');
            cardmargin(0, 'EXTRA');
            cardmargin(0, 'DECK');
            cardmargin(1, 'GRAVE');
            cardmargin(1, 'EXTRA');
            cardmargin(1, 'DECK');
            layouthand(0);
            layouthand(1);
            internalLocal = 'duelscreen';
        }, 100);

        $('#phaseindicator').attr('data-currentphase', message.info.phase);
        $('.p0lp').val(message.info.lifepoints[0]);
        $('.p1lp').val(message.info.lifepoints[1]);
        duelstash = message;
        updateChat(message.info.duelistChat, message.info.spectatorChat);
        break;
    case "shuffleHand0":
        doGuiShuffle(orient(0), 'HAND');
        setTimeout(function () {
            linkStack(message.field);
        }, 1000);

        break;
    case "shuffleHand1":
        doGuiShuffle(orient(1), 'HAND');
        setTimeout(function () {
            linkStack(message.field);
        }, 1000);
        break;
    case "shuffleDeck0":
        doGuiShuffle(orient(0), 'DECK');
        linkStack(message.field);
        break;
    case "shuffleDeck1":
        doGuiShuffle(orient(1), 'DECK');
        linkStack(message.field);
        break;
    case "duel":
        if (manualDuel === undefined) {
            startGame(message);
        }
        linkStack(message.field);

        setTimeout(function () {
            cardmargin(0, 'GRAVE');
            cardmargin(0, 'EXTRA');
            cardmargin(0, 'DECK');
            cardmargin(1, 'GRAVE');
            cardmargin(1, 'EXTRA');
            cardmargin(1, 'DECK');
            layouthand(0);
            layouthand(1);
            $('.attackglow').removeClass('attackglow');
        }, 100);
        updateChat(message.info.duelistChat);
        $('#phaseindicator').attr('data-currentphase', message.info.phase);
        $('.p0lp').val(message.info.lifepoints[0]);
        $('.p1lp').val(message.info.lifepoints[1]);
        duelstash = message;
        break;
    case "reveal":
        reveal(message.reveal, message.call);
        break;
    case 'removeCard':
        $('#uid' + message.info.removed).css('display', 'none');
        break;
    default:
        break;
    }
}

function serverconnect() {
    'use strict';

    try {
        window.manualServer.close();
        return;
    } catch (non_error) {
        console.log('Attempted to close manualmode websocket. Failed. Everything is fine.');
    }
    window.manualServer = new WebSocket("ws://" + location.hostname + ":8080");
    manualServer.onopen = function () {
        console.log('Connected to Manual');
    };
    manualServer.onmessage = function (message) {
        manualReciver(JSON.parse(message.data));
    };
    manualServer.onclose = function (message) {
        console.log('Manual Connection Died, reconnecting,...');
        if (internalLocal === 'surrendered') {
            alert('A Connection Error Occured');
        }
        setTimeout(serverconnect, 2000);
    };
    window.onbeforeunload = function () {
        manualServer.onclose = function () {}; // disable onclose handler first
        manualServer.close();
    };

}




function manualHost() {
    'use strict';
    var isChromium = window.chrome,
        winNav = window.navigator,
        vendorName = winNav.vendor,
        isOpera = winNav.userAgent.indexOf("OPR") > -1,
        isIEedge = winNav.userAgent.indexOf("Edge") > -1,
        isIOSChrome = winNav.userAgent.match("CriOS");

    //    if (isIOSChrome) {
    //        console.log();
    //    } else if (isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isOpera === false && isIEedge === false) {
    //        console.log();
    //    } else {
    //        alert('This site only works with Google Chrome');
    //        return;
    //    }
    manualServer.send(JSON.stringify({
        action: 'host',
        name: localStorage.nickname
    }));
}

function manualJoin(game) {
    'use strict';
    var isChromium = window.chrome,
        winNav = window.navigator,
        vendorName = winNav.vendor,
        isOpera = winNav.userAgent.indexOf("OPR") > -1,
        isIEedge = winNav.userAgent.indexOf("Edge") > -1,
        isIOSChrome = winNav.userAgent.match("CriOS");

    //    if (isIOSChrome) {
    //        console.log();
    //    } else if (isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isOpera === false && isIEedge === false) {
    //        console.log();
    //    } else {
    //        alert('This site only works with Google Chrome');
    //        return;
    //    }
    manualServer.send(JSON.stringify({
        action: 'join',
        game: game,
        name: localStorage.nickname
    }));
}

function manualKickDuelist(slot) {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'kick',
        slot: slot,
        game: activegame
    }));
}

function manualLeave() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'leave',
        game: activegame
    }));
}

function manualSurrender() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'surrender'
    }));
}

function surrender() {
    'use strict';
    if (confirm('Are you sure?')) {
        internalLocal = 'surrendered';
        manualSurrender();
    }

    //singlesitenav('gamelist');
}

function manualLock() {
    'use strict';
    var deck = getdeck();
    if (deck.main.length > 39) {
        manualServer.send(JSON.stringify({
            action: 'lock',
            deck: deck
        }));
    } else {
        alert('Main Deck is less than 40 cards, please choose another deck.');
    }

}

function manualStart() {
    'use strict';
    if (activegame) {
        if (broadcast[activegame].player[0].ready && broadcast[activegame].player[1].ready) {
            manualServer.send(JSON.stringify({
                action: 'start'
            }));
            return;
        }
    }
    alert('Duelist not ready yet. Please Lock in decks');
}

function manualChat(message) {
    'use strict';
    manualServer.send(JSON.stringify({}));
}

function manualNextPhase(phase) {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'nextPhase',
        phase: phase,
        sound: 'soundphase'
    }));
}

function manualNextTurn() {
    'use strict';
    manualServer.send({
        action: 'nextTurn'
    });
}

function manualChangeLifepoints(amount) {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'changeLifepoints',
        amount: amount,
        sound: 'soundchangeLifePoints'
    }));
}

function manualMoveCard(movement) {
    'use strict';
    manualServer.send(JSON.stringify(movement));
}

function manualShuffleHand() {
    'use strict';
    setTimeout(function () {
        manualServer.send(JSON.stringify({
            action: 'shuffleHand',
            sound: 'soundcardShuffle'
        }));
    });

}



function manualDraw() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'draw',
        sound: 'sounddrawCard'
    }));
}

function manualExcavateTop() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'excavate',
        sound: 'sounddrawCard'
    }));
}

function manualShuffleDeck() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'shuffleDeck',
        sound: 'soundcardShuffle'
    }));
}

function manualRevealTop() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'revealTop'
    }));
}

function manualRevealBottom() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'revealBottom'
    }));
}

function manualRevealDeck() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'revealDeck'
    }));
}

function manualRevealExtra() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'revealExtra'
    }));
}

function manualRevealExcavated() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'revealExcavated'
    }));
}

function manualMill() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'mill'
    }));
}


function manualMillRemovedCard() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'millRemovedCard'
    }));
}

function manualMillRemovedCardFaceDown() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'millRemovedCardFaceDown'
    }));
}

function manualViewDeck() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'viewDeck'
    }));
}

function manualViewBanished() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'viewBanished',
        player: manualActionReference.player
    }));
}

function manualFlipDeck() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'flipDeck'
    }));
}

function manualAddCounter() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'addCounter',
        uid: manualActionReference.uid
    }));
}

function manualRemoveCounter() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'removeCounter',
        uid: manualActionReference.uid
    }));
}


var zonetargetingmode;

function startAttack() {
    'use strict';
    attackmode = true;
    $('.card.p1').addClass('attackglow');
}

function startTarget() {
    'use strict';
    targetmode = true;
    $('.card.p1, .card.p0').addClass('attackglow');
}

function startSpecialSummon(mode) {
    'use strict';
    zonetargetingmode = mode;
    $('.cardselectionzone.p0.MONSTERZONE').addClass('attackglow card');
}

function startSpellTargeting(mode) {
    'use strict';
    zonetargetingmode = mode;
    $('.cardselectionzone.p0.SPELLZONE').addClass('attackglow card');
}

var overlaylist;

function startXYZSummon(target) {
    'use strict';
    if ($('.card.p0.MONSTERZONE').length === 0) {
        return;
    }
    overlaymode = true;
    overlaylist = [manualActionReference];
    $('.card.p0.MONSTERZONE').addClass('attackglow');
}

function manualAttack() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'attack',
        source: manualActionReference,
        target: targetreference,
        sound: 'soundattack'
    }));
    attackmode = false;
    $('.card.p1').removeClass('attackglow');
}

function manualTarget(target) {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'target',
        target: target
    }));
    targetmode = false;
    $('.card').removeClass('targetglow');
}



function manualRemoveToken() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'removeToken',
        uid: manualActionReference.uid
    }));
}

function manualViewExtra() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'viewExtra',
        player: manualActionReference.player
    }));
}

function manualViewExcavated() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'viewExcavated',
        player: manualActionReference.player
    }));
}

function manualViewGrave() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'viewGrave',
        player: manualActionReference.player
    }));
}

function manualViewXYZMaterials() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'viewXYZ',
        index: manualActionReference.index,
        player: manualActionReference.player
    }));
}




var gui = {};



function makeMonster(card, index) {
    'use strict';
    return {
        player: card.player,
        location: 'MONSTERZONE',
        index: index,
        position: 'FaceUpAttack',
        overlayindex: 0,
        isBecomingCard: false
    };
}

function makeSpell(card, index) {
    'use strict';
    return {
        player: card.player,
        location: 'SPELLZONE',
        index: index,
        position: 'FaceUp',
        overlayindex: 0,
        isBecomingCard: false
    };
}

function makeHand(card, index) {
    'use strict';
    return {
        player: card.player,
        location: 'HAND',
        index: index,
        position: 'FaceUp',
        overlayindex: 0,
        isBecomingCard: false
    };
}

function makeDeckCard(card, index) {
    'use strict';
    return {
        player: card.player,
        location: 'DECK',
        index: index,
        position: 'FaceDown',
        overlayindex: 0,
        isBecomingCard: false
    };
}

function makeExtra(card, index) {
    'use strict';
    return {
        player: card.player,
        location: 'EXTRA',
        index: index,
        position: 'FaceDown',
        overlayindex: 0,
        isBecomingCard: false
    };
}

function makeGrave(card, index) {
    'use strict';
    return {
        player: card.player,
        location: 'GRAVE',
        index: index,
        position: 'FaceUp',
        overlayindex: 0,
        isBecomingCard: false
    };
}

function makeRemoved(card, index) {
    'use strict';
    return {
        player: card.player,
        location: 'REMOVED',
        index: index,
        position: 'FaceUp',
        overlayindex: 0,
        isBecomingCard: false
    };
}

function setMonster(card, index) {
    'use strict';
    var end = makeMonster(card, index);
    end.position = 'FaceDownDefence';
    return end;
}

function defenceMonster(card, index) {
    'use strict';
    var end = makeMonster(card, index);
    end.position = 'FaceUpDefence';
    return end;
}

function setSpell(card, index) {
    'use strict';
    var end = makeSpell(card, index);
    end.position = 'FaceDown';
    return end;
}

function makeFieldSpell(card) {
    'use strict';
    if ($('#automationduelfield .p' + card.player + '.SPELLZONE.i5').length < 1) {
        return makeSpell(card, 5);
    } else {
        throw new Error('There is a card in the field zone');
    }

}

function makeFieldSpellFaceDown(card) {
    'use strict';
    var end = setSpell(card, 5);
    return end;
}

function makePendulumZoneL(card) {
    'use strict';
    return makeSpell(card, 0);
}

function makePendulumZoneR(card) {
    'use strict';
    return makeSpell(card, 4);
}

function makeCardMovement(start, end) {
    'use strict';
    if (end.position === undefined) {
        end.position = start.position;
    }
    if (end.overlayindex === undefined) {
        end.overlayindex = 0;
    }
    if (end.isBecomingCard === undefined) {
        end.isBecomingCard = false;
    }
    if (end.index === undefined) {
        end.index = start.index;
    }
    return {
        code: start.code,
        player: start.player,
        clocation: start.location,
        index: start.index,
        moveplayer: end.player,
        movelocation: end.location,
        moveindex: end.index,
        moveposition: end.position,
        overlayindex: end.overlayindex,
        isBecomingCard: end.isBecomingCard,
        uid: start.uid
    };
}


function manualNormalSummon(index) {
    'use strict';

    index = (index !== undefined) ? index : manualActionReference.index;
    var end = makeMonster(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    message.sound = 'soundspecialSummonFromExtra';
    manualServer.send(JSON.stringify(message));
}

function manualToAttack(index) {
    'use strict';

    index = (index !== undefined) ? index : manualActionReference.index;
    var end = makeMonster(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    message.sound = 'soundspecialSummonFromExtra';
    manualServer.send(JSON.stringify(message));
}

function manualSetMonster(index) {
    'use strict';

    index = (index !== undefined) ? index : automaticZonePicker(manualActionReference.player, 'MONSTERZONE');
    var end = setMonster(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    message.sound = 'soundspecialSummonFromExtra';
    manualServer.send(JSON.stringify(message));
}

function manualToDefence() {
    'use strict';

    var index = manualActionReference.index,
        end = defenceMonster(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    manualServer.send(JSON.stringify(message));
}



function manualToFaceDownDefence() {
    'use strict';

    var index = manualActionReference.index,
        end = setMonster(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    manualServer.send(JSON.stringify(message));
}

function manualSetMonsterFaceUp() {
    'use strict';

    var index = automaticZonePicker(manualActionReference.player, 'MONSTERZONE'),
        end = defenceMonster(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    message.sound = 'soundspecialSummonFromExtra';
    manualServer.send(JSON.stringify(message));
}

function manualActivate(index) {
    'use strict';

    index = (index !== undefined) ? index : automaticZonePicker(manualActionReference.player, 'SPELLZONE');
    var end = makeSpell(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    message.sound = 'soundactivateCard';
    manualServer.send(JSON.stringify(message));
}

function manualActivateFieldSpell() {
    'use strict';

    var end = makeFieldSpell(manualActionReference),
        message = makeCardMovement(manualActionReference, end);
    message.sound = 'soundactivateCard';
    message.action = 'moveCard';
    manualServer.send(JSON.stringify(message));
}

function manualActivateFieldSpellFaceDown() {
    'use strict';

    var end = makeFieldSpellFaceDown(manualActionReference),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    message.sound = 'soundsetCard';
    manualServer.send(JSON.stringify(message));
}

function manualSetSpell(index) {
    'use strict';

    index = (index !== undefined) ? index : automaticZonePicker(manualActionReference.player, 'SPELLZONE');
    var end = setSpell(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    message.sound = 'soundsetCard';
    manualServer.send(JSON.stringify(message));
}

function manualSTFlipDown() {
    'use strict';

    var index = manualActionReference.index,
        end = setSpell(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    message.sound = 'soundflipSummon';
    manualServer.send(JSON.stringify(message));
}

function manualSTFlipUp() {
    'use strict';

    var index = manualActionReference.index,
        end = makeSpell(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    message.sound = 'soundflipSummon';
    manualServer.send(JSON.stringify(message));
}





function manualToExcavate() {
    'use strict';
    var index = $('#automationduelfield .p' + orient(manualActionReference.player) + '.EXCAVATED').length,
        end = makeHand(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.movelocation = 'EXCAVATED';
    message.action = 'moveCard';
    manualServer.send(JSON.stringify(message));
}

function manualToExtra() {
    'use strict';
    var index = $('#automationduelfield .p' + orient(manualActionReference.player) + '.EXTRA').length,
        end = makeExtra(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';

    message.moveposition = 'FaceDown';
    manualServer.send(JSON.stringify(message));
}

function manualToOpponentsHand() {
    'use strict';
    if (cardIs('fusion', manualActionReference) || cardIs('synchro', manualActionReference) || cardIs('xyz', manualActionReference) || cardIs('link', manualActionReference)) {
        manualToExtra();
        return;
    }
    var moveplayer = (manualActionReference.player) ? 0 : 1,
        index = $('#automationduelfield .p' + orient(manualActionReference.player) + '.HAND').length,
        end = makeHand(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    message.moveplayer = moveplayer;
    manualServer.send(JSON.stringify(message));
}

function manualToTopOfDeck() {
    'use strict';
    if (cardIs('fusion', manualActionReference) || cardIs('synchro', manualActionReference) || cardIs('xyz', manualActionReference) || cardIs('link', manualActionReference)) {
        manualToExtra();
        return;
    }
    if (cardIs('fusion', manualActionReference) || cardIs('synchro', manualActionReference) || cardIs('xyz', manualActionReference) || cardIs('link', manualActionReference)) {
        manualToExtra();
        return;
    }
    var index = $('#automationduelfield .p' + orient(manualActionReference.player) + '.DECK').length,
        end = makeDeckCard(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    manualServer.send(JSON.stringify(message));
}

function manualToBottomOfDeck() {
    'use strict';

    manualServer.send(JSON.stringify({
        action: 'offsetDeck'
    }));
    var index = 0,
        end = makeDeckCard(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    setTimeout(function () {
        manualServer.send(JSON.stringify(message));
    }, 300);

}

function manualSlideRight() {
    'use strict';

    var index = manualActionReference.index + 1,
        end = JSON.parse(JSON.stringify(manualActionReference)),
        message = makeCardMovement(manualActionReference, end);

    if (index === 5) {
        index = 0;
    }
    message.moveindex = index;
    message.action = 'moveCard';
    manualServer.send(JSON.stringify(message));
}

function manualSlideLeft() {
    'use strict';

    var index = manualActionReference.index - 1,
        end = JSON.parse(JSON.stringify(manualActionReference)),
        message = makeCardMovement(manualActionReference, end);

    if (index === -1) {
        index = 4;
    }
    message.moveindex = index;
    message.action = 'moveCard';
    manualServer.send(JSON.stringify(message));
}

function manualOverlay() {
    'use strict';
    var overlayindex = 0;
    revealcache.forEach(function (card, index) {
        if (index === revealcacheIndex) {
            return;
        }
        overlayindex++;
        var message = makeCardMovement(card, card);
        message.overlayindex = overlayindex;
        message.action = 'moveCard';
        manualServer.send(JSON.stringify(message));
    });
}

function manualXYZSummon(target) {
    'use strict';
    overlaymode = false;
    overlaylist.push(target);
    $('.card').removeClass('targetglow');


    var index = target.index,
        end = makeMonster(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    manualServer.send(JSON.stringify(message));
    setTimeout(function () {
        var overlayindex = 0;
        overlaylist.forEach(function (card, cindex) {
            overlayindex++;
            var message = makeCardMovement(card, card);
            message.overlayindex = overlayindex;
            message.action = index;
            message.action = 'moveCard';
            manualServer.send(JSON.stringify(message));
        });
    }, 1000);
}


function manualToGrave() {
    'use strict';
    var index = $('#automationduelfield .p' + orient(manualActionReference.player) + '.GRAVE').length,
        end = makeGrave(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    manualServer.send(JSON.stringify(message));
}

function manualToOpponentsGrave() {
    'use strict';
    var moveplayer = (manualActionReference.player) ? 0 : 1,
        index = $('#automationduelfield .p' + orient(manualActionReference.player) + '.GRAVE').length,
        end = makeGrave(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    message.moveplayer = moveplayer;
    manualServer.send(JSON.stringify(message));
}

function manualToRemoved() {
    'use strict';
    var index = $('#automationduelfield .p' + orient(manualActionReference.player) + '.REMOVED').length,
        end = makeRemoved(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    manualServer.send(JSON.stringify(message));
}



function manualToExtraFaceUp() {
    'use strict';
    var index = $('#automationduelfield .p' + orient(manualActionReference.player) + '.EXTRA').length,
        end = makeExtra(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    message.moveposition = 'FaceUp';
    manualServer.send(JSON.stringify(message));
}

function manualToHand() {
    'use strict';
    if (cardIs('fusion', manualActionReference) || cardIs('synchro', manualActionReference) || cardIs('xyz', manualActionReference) || cardIs('link', manualActionReference)) {
        manualToExtra();
        return;
    }
    var index = $('#automationduelfield .p' + orient(manualActionReference.player) + '.HAND').length,
        end = makeHand(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    manualServer.send(JSON.stringify(message));
}

function manualToExtra() {
    'use strict';
    var index = $('#automationduelfield .p' + orient(manualActionReference.player) + '.EXTRA').length,
        end = makeExtra(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';

    message.moveposition = 'FaceDown';
    manualServer.send(JSON.stringify(message));
}

function manualToRemovedFacedown() {
    'use strict';
    var index = $('#automationduelfield .p' + orient(manualActionReference.player) + '.REMOVED').length,
        end = makeRemoved(manualActionReference, index),
        message = makeCardMovement(manualActionReference, end);
    message.position = 'FaceDown';
    message.action = 'moveCard';
    manualServer.send(JSON.stringify(message));
}

function manualActivateField() {
    'use strict';
    if ($('#automationduelfield .p' + orient(manualActionReference.player) + '.SPELLZONE.i5').length) {
        return;
    }
    var end = makeSpell(manualActionReference, 5),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    message.sound = 'soundsetCard';
    manualServer.send(JSON.stringify(message));
}

function manualToPZoneL() {
    'use strict';

    if ($('#automationduelfield .p' + orient(manualActionReference.player) + '.SPELLZONE.i0').length) {
        return;
    }
    var end = makeSpell(manualActionReference, 0),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    message.sound = 'soundsetCard';
    manualServer.send(JSON.stringify(message));
}

function manualToPZoneR() {
    'use strict';
    if ($('#automationduelfield .p' + orient(manualActionReference.player) + '.SPELLZONE.i4').length) {
        return;
    }
    var end = makeSpell(manualActionReference, 4),
        message = makeCardMovement(manualActionReference, end);

    message.action = 'moveCard';
    message.sound = 'soundsetCard';
    manualServer.send(JSON.stringify(message));
}

function manualRevealHandSingle() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'revealHandSingle',
        card: manualActionReference
    }));
}

function manualRevealExtraDeckRandom() {
    'use strict';

    var card = manualActionReference;
    card.index = Math.floor((Math.random() * $('#automationduelfield .p' + orient(manualActionReference.player) + '.EXTRA').length));

    manualServer.send(JSON.stringify({
        action: 'reveal',
        card: card
    }));
}

function manualRevealExcavatedRandom() {
    'use strict';

    var card = manualActionReference;
    card.index = Math.floor((Math.random() * $('#automationduelfield .p' + orient(manualActionReference.player) + '.EXCAVATED').length));

    manualServer.send(JSON.stringify({
        action: 'reveal',
        card: card
    }));
}


var currentMousePos = {
    x: -1,
    y: -1
};

function reorientmenu() {
    'use strict';
    var height = $('#manualcontrols').height(),
        width = $('#manualcontrols').width() / 2,
        systemHeight = $(document).height();

    if (currentMousePos.y - height < 0) {
        currentMousePos.y = height;
    }

    $('#manualcontrols').css({
        'top': currentMousePos.y - height,
        'left': currentMousePos.x - width,
        'display': 'block'
    });

}


var sideReference = {};

function moveInArray(array, old_index, new_index) {
    'use strict';
    if (new_index >= array.length) {
        var k = new_index - array.length;
        while ((k--) + 1) {
            array.push(undefined);
        }
    }
    array.splice(new_index, 0, array.splice(old_index, 1)[0]);
    return array; // for testing purposes
}

function sidemoveTo(deck) {
    'use strict';
    moveInArray(sidedDeck[sideReference.zone], sideReference.index, 0);
    var card = sidedDeck[sideReference.zone].shift();
    sidedDeck[deck].push(card);
    renderSideDeckZone(sidedDeck);
}

function sideonclick(index, zone) {
    'use strict';

    sideReference = {
        id: sidedDeck[zone][index],
        zone: zone,
        index: index
    };
    $('#manualcontrols button').css({
        'display': 'none'
    });

    $('#manualcontrols').css({
        'top': currentMousePos.y,
        'left': currentMousePos.x,
        'display': 'block'
    });
    var dbEntry = getCardObject(parseInt(sideReference.id, 10));
    if (sideReference.zone === 'main') {
        $('.s-toside').css({
            'display': 'block'
        });

    }
    if (sideReference.zone === 'extra') {
        $('.s-toside').css({
            'display': 'block'
        });
    }
    if (sideReference.zone === 'side') {
        if (cardIs('xyz', dbEntry) || cardIs('fusion', dbEntry) || cardIs('synchro', dbEntry)) {
            $('.s-toextra').css({
                'display': 'block'
            });
        } else {
            $('.s-tomain').css({
                'display': 'block'
            });
        }
    }
    reorientmenu();
    return;
}



function revealonclick(card, note) {
    'use strict';
    // Goblin circus removes...
    //    if (note !== 'view') {
    //        return;
    //    }
    revealcacheIndex = card;
    manualActionReference = revealcache[card];
    $('#manualcontrols button').css({
        'display': 'none'
    });


    if (manualActionReference.player !== orientSlot) {
        return;
    }

    $('#manualcontrols').css({
        'top': currentMousePos.y,
        'left': currentMousePos.x,
        'display': 'block'
    });
    var dbEntry = getCardObject(parseInt(manualActionReference.id, 10));
    if (manualActionReference.location === 'DECK') {
        $('.v-deck').css({
            'display': 'block'
        });
        if (monsterMap[dbEntry.type]) {
            $('.m-hand-m').css({
                'display': 'block'
            });
        }
        if (stMap[dbEntry.type] || dbEntry.type === 2 || dbEntry.type === 4) {
            $('.m-hand-st').css({
                'display': 'block'
            });
        }
        if (fieldspell[dbEntry.type]) {
            $('.m-hand-f').css({
                'display': 'block'
            });
        }
        if (pendulumMap[dbEntry.type]) {
            $('.m-hand-p').css({
                'display': 'block'
            });
            $('.m-monster-p').css({
                'display': 'block'
            });

        }

        reorientmenu();
        return;
    }

    if (manualActionReference.location === 'GRAVE') {
        $('.v-grave').css({
            'display': 'block'
        });
        if (pendulumMap[dbEntry.type]) {
            $('.m-hand-p').css({
                'display': 'block'
            });
            $('.m-monster-p').css({
                'display': 'block'
            });

        }
        if (monsterMap[dbEntry.type]) {
            $('.m-hand-m').css({
                'display': 'block'
            });
        }
        if (stMap[dbEntry.type] || dbEntry.type === 2 || dbEntry.type === 4) {
            $('.m-hand-st').css({
                'display': 'block'
            });
        }
        if (fieldspell[dbEntry.type]) {
            $('.m-hand-f').css({
                'display': 'block'
            });
        }
        if (pendulumMap[dbEntry.type]) {
            $('.m-hand-p').css({
                'display': 'block'
            });
        }
        reorientmenu();
        return;
    }
    if (manualActionReference.location === "EXCAVATED") {
        $('.v-excavate').css({
            'display': 'block'
        });
        $('.m-hand').css({
            'display': 'block'
        });
        if (pendulumMap[dbEntry.type]) {
            $('.m-hand-p').css({
                'display': 'block'
            });
            $('.m-monster-p').css({
                'display': 'block'
            });

        }
        if (monsterMap[dbEntry.type]) {
            $('.m-hand-m').css({
                'display': 'block'
            });
        }
        if (stMap[dbEntry.type] || dbEntry.type === 2 || dbEntry.type === 4) {
            $('.m-hand-st').css({
                'display': 'block'
            });
        }
        if (fieldspell[dbEntry.type]) {
            $('.m-hand-f').css({
                'display': 'block'
            });
        }
        if (pendulumMap[dbEntry.type]) {
            $('.m-hand-p').css({
                'display': 'block'
            });
        }
        reorientmenu();
        return;
    }
    if (manualActionReference.location === "REMOVED") {
        $('.v-removed').css({
            'display': 'block'
        });
        if (pendulumMap[dbEntry.type]) {
            $('.m-hand-p').css({
                'display': 'block'
            });
            $('.m-monster-p').css({
                'display': 'block'
            });

        }
        if (monsterMap[dbEntry.type]) {
            $('.m-hand-m').css({
                'display': 'block'
            });
        }
        if (stMap[dbEntry.type] || dbEntry.type === 2 || dbEntry.type === 4) {
            $('.m-hand-st').css({
                'display': 'block'
            });
        }
        if (fieldspell[dbEntry.type]) {
            $('.m-hand-f').css({
                'display': 'block'
            });
        }
        if (pendulumMap[dbEntry.type]) {
            $('.m-hand-p').css({
                'display': 'block'
            });
        }
        reorientmenu();
        return;
    }
    if (manualActionReference.location === 'EXTRA') {
        $('.v-extra').css({
            'display': 'block'
        });
        if (cardIs('xyz', dbEntry)) {
            $('.v-monster-xyz').css({
                'display': 'block'
            });
        }
        if (pendulumMap[dbEntry.type]) {
            $('.v-extra-p').css({
                'display': 'block'
            });

            $('.m-monster-p').css({
                'display': 'block'
            });

        }


        reorientmenu();
        return;
    }
    if (cardIs('xyz', dbEntry)) {
        $('.v-monster-xyz').css({
            'display': 'block'
        });
    }
    if (manualActionReference.location === 'MONSTERZONE') {
        $('.m-field').css({
            'display': 'block'
        });
        if (pendulumMap[dbEntry.type]) {
            $('.m-hand-p').css({
                'display': 'block'
            });
            $('.m-monster-p').css({
                'display': 'block'
            });

        }
        if (cardIs('xyz', dbEntry)) {
            $('.v-monster-xyz').css({
                'display': 'block'
            });
        }
        reorientmenu();
        return;
    }
    if (manualActionReference.location === 'SPELLZONE') {
        $('.m-field').css({
            'display': 'block'
        });
        if (dbEntry.id === 62966332) {
            $('.m-convulse').css({
                'display': 'block'
            });
        }
        if (dbEntry.id === 63571750) {
            $('.m-pharaohstreasure').css({

            });
        }
        if (pendulumMap[dbEntry.type]) {
            $('.m-monster-to-extra-faceup').css({
                'display': 'block'
            });

        }
        reorientmenu();
        return;
    }


}








function parseLevelScales(card) {
    'use strict';
    var output = "",
        leftScale,
        rightScale,
        pendulumLevel,
        level = card.level,
        ranklevel = (cardIs('xyz', card)) ? '☆' : '★';
    if (level > 0 && level <= 12) {
        output += '<span class="levels">' + ranklevel + level;

    } else {
        level = level.toString(16); // format: [0-9A-F]0[0-9A-F][0-9A-F]{4}
        leftScale = parseInt(level.charAt(0), 16); // first digit: left scale in hex (0-16)
        rightScale = parseInt(level.charAt(2), 16); // third digit: right scale in hex (0-16)
        pendulumLevel = parseInt(level.charAt(6), 16); // seventh digit: level of the monster in hex (technically, all 4 digits are levels, but here we only need the last char)
        output += '<span class="levels">' + ranklevel + pendulumLevel + '</span> <span class="scales"><< ' + leftScale + ' | ' + rightScale + ' >>';
    }
    return output + '</span>';
}

function parseAtkDef(atk, def) {
    'use strict';
    return ((atk < 0) ? "?" : atk) + " / " + ((def < 0) ? "?" : def);
}

function makeDescription(id) {
    'use strict';
    var targetCard = getCardObject(parseInt(id, 10)),
        output = "";
    if (!targetCard) {
        //        return '<span class="searchError">An error occurred while looking up the card in our database.<br />Please report this issue <a href="' + forumLink + '" target="_blank">at our forums</a> and be sure to include following details:<br /><br />Subject: Deck Editor Error<br />Function Call: makeDescription(' + id + ')<br />User Agent: ' + navigator.userAgent + '</span>';
        return '';
    }
    output += '<div class="descContainer"><span class="cardName">' + targetCard.name + ' [' + id + ']</span><br />';
    if (cardIs("monster", targetCard)) {
        output += "<span class='monsterDesc'>[ Monster / " + monsterMap[targetCard.type] + " ]<br />" + raceMap[targetCard.race] + " / " + attributeMap[targetCard.attribute] + "<br />";
        output += "[ " + parseLevelScales(targetCard) + " ]<br />" + parseAtkDef(targetCard.atk, targetCard.def) + "</span>";
    } else if (cardIs("spell", targetCard)) {
        output += "<span class='spellDesc'>[ Spell" + (stMap[targetCard.type] || "") + " ]</span>";
    } else if (cardIs("trap", targetCard)) {
        output += "<span class='trapDesc'>[ Trap" + (stMap[targetCard.type] || "") + " ]</span>";
    }
    return output + "<br /><pre class='description'>" + targetCard.desc + "</pre>";
}

var record;

function checksetcode(obj, sc) {
    'use strict';
    var val = obj.setcode,
        hexA = val.toString(16),
        hexB = sc.toString(16);
    if (val === sc || parseInt(hexA.substr(hexA.length - 4), 16) === parseInt(hexB, 16) || parseInt(hexA.substr(hexA.length - 2), 16) === parseInt(hexB, 16) || (val >> 16).toString(16) === hexB) {
        return true;
    } else {
        return false;
    }
}

function selectionzoneonclick(choice) {
    'use strict';
    console.log('selectionzoneonclick', choice);
    if (zonetargetingmode) {
        $('.cardselectionzone.p0').removeClass('card');
        $('.cardselectionzone.p0').removeClass('attackglow');
        if (zonetargetingmode === 'atk') {
            manualToAttack(choice);
        }
        if (zonetargetingmode === 'def') {
            manualSetMonster(choice);
        }
        if (zonetargetingmode === 'normalatk') {
            manualNormalSummon(choice);
        }
        if (zonetargetingmode === 'normaldef') {
            manualSetMonster(choice);
        }
        if (zonetargetingmode === 'activate') {
            manualActivate(choice);
        }
        if (zonetargetingmode === 'set') {
            manualSetSpell(choice);
        }
        zonetargetingmode = false;
        return;
    }
}

function guicardonclick() {
    'use strict';
    try {
        var idIndex = window.manualDuel.uidLookup(record),
            stackunit = window.manualDuel.stack[idIndex],
            dbEntry;

        if (targetmode) {
            manualTarget(stackunit);
            return;
        }
        if (zonetargetingmode) {
            return;
        }

        if (overlaymode) {
            if (stackunit.location === 'MONSTERZONE') {
                manualXYZSummon(stackunit);
            }
            return;
        }

        if (attackmode) {
            if (stackunit.player !== manualActionReference.player) {
                targetreference = stackunit;
                manualAttack();
                return;
            }
            return;
        }
        manualActionReference = null;
        $('#manualcontrols button').css({
            'display': 'none'
        });



        manualActionReference = stackunit;
        dbEntry = getCardObject(parseInt(stackunit.id, 10));
        if (stackunit.location === 'GRAVE') {
            $('.m-grave').css({
                'display': 'block'
            });
            reorientmenu();
            return;
        }
        if (stackunit.location === 'EXCAVATED') {
            $('.m-excavated').css({
                'display': 'block'
            });
            reorientmenu();
            return;
        }
        if (stackunit.location === 'EXTRA') {
            $('.m-extra-view').css({
                'display': 'block'
            });
        }
        if (stackunit.location === 'REMOVED') {
            $('.m-removed').css({
                'display': 'block'
            });
            reorientmenu();
            return;
        }
        if (stackunit.player !== orientSlot) {
            return;
        }
        $('#manualcontrols').css({
            'top': currentMousePos.y,
            'left': currentMousePos.x,
            'display': 'block'
        });
        if (stackunit.location === 'DECK') {
            $('.m-deck').css({
                'display': 'block'
            });
            reorientmenu();
            return;
        }
        if (stackunit.location === 'HAND') {
            $('.m-hand').css({
                'display': 'block'
            });
            if (monsterMap[dbEntry.type]) {
                $('.m-hand-m').css({
                    'display': 'block'
                });
            }
            if (stMap[dbEntry.type] || dbEntry.type === 2 || dbEntry.type === 4) {
                $('.m-hand-st').css({
                    'display': 'block'
                });
            }
            if (fieldspell[dbEntry.type]) {
                $('.m-hand-f').css({
                    'display': 'block'
                });
            }
            if (pendulumMap[dbEntry.type]) {
                $('.m-hand-p, .m-monster-p').css({
                    'display': 'block'
                });
            }


            reorientmenu();
            return;
        }
        if (stackunit.location === 'GRAVE') {
            $('.m-grave').css({
                'display': 'block'
            });
            if (pendulumMap[dbEntry.type]) {
                $('.m-monster-p').css({
                    'display': 'block'
                });
            }
            reorientmenu();
            return;
        }

        if (stackunit.location === 'EXTRA') {
            $('.m-extra').css({
                'display': 'block'
            });
            reorientmenu();
            return;
        }

        if (stackunit.location === 'REMOVED') {
            $('.m-removed').css({
                'display': 'block'
            });
            if (pendulumMap[dbEntry.type]) {
                $('.m-monster-p').css({
                    'display': 'block'
                });
            }
            reorientmenu();
            return;
        }
        if (stackunit.location === 'MONSTERZONE') {
            $('.m-monster, .m-field').css({
                'display': 'block'
            });
            if ($("#phaseindicator").attr('data-currentphase') === '3') {
                $('.a-field').css({
                    'display': 'block'
                });
            }
            if (pendulumMap[dbEntry.type] || cardIs('fusion', dbEntry) || cardIs('syncho', dbEntry) || cardIs('xyz', dbEntry)) {
                $('.m-monster-extra').css({
                    'display': 'block'
                });
            }
            if (pendulumMap[dbEntry.type]) {
                $('.m-monster-p').css({
                    'display': 'block'
                });
            }
            if (cardIs('xyz', dbEntry)) {
                $('.m-monster-xyz').css({
                    'display': 'block'
                });
            }
            if (!excludeTokens(dbEntry)) {
                $('.m-monster-token').css({
                    'display': 'block'
                });
            }

            if (checksetcode(dbEntry, 151) || dbEntry.id === 9791914 || dbEntry.id === 58132856) {
                $('.m-st-monster').css({
                    'display': 'block'
                });
            }
            if (dbEntry.id === 27911549) {
                $('.m-parasite').css({
                    'display': 'block'
                });
            }

            reorientmenu();
            return;
        }
        if (stackunit.location === 'SPELLZONE') {
            $('.m-st, .m-field').css({
                'display': 'block'
            });
            if (dbEntry.id === 62966332) {
                $('.m-convulse').css({
                    'display': 'block'
                });
            }
            if (dbEntry.id === 63571750) {
                $('.m-pharaohstreasure').css({

                });
            }
            if (pendulumMap[dbEntry.type]) {
                $('.m-monster-p').css({
                    'display': 'block'
                });
            }
            reorientmenu();
            return;
        }
    } catch (error) {
        console.log('On Card Click Error:', error);
        reorientmenu();
        return;
    }
}
var internalDB = [];


function processCardHover(event) {
    'use strict';
    var uid = event.currentTarget.id,
        html = '';

    record = parseInt($('#' + uid).attr('data-uid'), 10);
    try {
        html = makeDescription($('#' + uid).attr('data-id'));
    } catch (fail) {
        html = '';
    }

    $('.imgContainer').attr('src', $('#' + event.currentTarget.id).attr('src'));
    $('.cardDescription').html(html);


}

$(document).ready(function () {
    'use strict';
    serverconnect();
    $('.imgContainer').attr('src', 'img/textures/cover.jpg');
    $('body').on('mouseover', '.card, .revealedcard', processCardHover);
    $('#manualcontrols button').click(function () {

        setTimeout(function () {
            $('#manualcontrols button').css({
                'display': 'none'
            });
            $('#sidechatinput').focus();
        }, 100);
    });
});

$(document).mousemove(function (event) {
    'use strict';
    currentMousePos.x = event.pageX;
    currentMousePos.y = event.pageY;
});



var lastchat;

function manualToken() {
    'use strict';
    var card = {};
    card.player = orientSlot;
    card.location = 'MONSTERZONE';
    card.position = 'FaceUpDefence';
    card.id = parseInt($('#tokendropdown').val(), 10);
    card.index = automaticZonePicker(orientSlot, 'MONSTERZONE');
    card.action = 'makeToken';
    manualServer.send(JSON.stringify(card));
}

function manualRoll() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'rollDie',
        name: localStorage.nickname
    }));
}

function manualFlip() {
    'use strict';
    manualServer.send(JSON.stringify({
        action: 'flipCoin',
        name: localStorage.nickname
    }));
}

$('#lobbychatinput, #sidechatinput, #spectatorchatinput').keypress(function (e) {
    'use strict';
    if ($(e.currentTarget).val().length === 0) {
        return;
    }
    if (e.which === 40) {
        $(e.currentTarget).val(lastchat);
        return;
    }
    if (e.which === 13) {
        if ($(e.currentTarget).val()) {
            lastchat = $(e.currentTarget).val();
        }
        var parts = $('#sidechatinput').val().split(' '),
            amount = 0,
            card = {},
            i;
        if (parts[0] === '/surrender') {
            $(e.currentTarget).val('');
            surrender();
            return;
        }
        if (parts[0] === '/side') {
            $(e.currentTarget).val('');
            startSiding();
            return;
        }
        if (parts[0] === '/roll') {
            $(e.currentTarget).val('');
            manualRoll();
            return;
        }
        if (parts[0] === '/flip') {
            $(e.currentTarget).val('');
            manualFlip();
            return;
        }
        if (parts[0] === '/token') {
            $(e.currentTarget).val('');
            manualToken();
            return;
        }

        if (parts.length === 2) {
            if (parts[0] === '/sub') {
                amount = (-1) * parseInt(parts[1], 10);
                if (isNaN(amount)) {
                    return;
                }
                manualChangeLifepoints(amount);
                $(e.currentTarget).val('');
                return;
            }
            if (parts[0] === '/add') {
                amount = parseInt(parts[1], 10);
                if (isNaN(amount)) {
                    return;
                }
                manualChangeLifepoints(amount);
                $(e.currentTarget).val('');
                return;
            }
            if (parts[0] === '/draw') {
                amount = parseInt(parts[1], 10);
                if (isNaN(amount)) {
                    return;
                }
                for (i = 0; i < amount; i++) {
                    manualDraw();
                }
                $(e.currentTarget).val('');
                return;
            }
            if (parts[0] === '/excavate') {
                amount = parseInt(parts[1], 10);
                if (isNaN(amount)) {
                    return;
                }
                for (i = 0; i < amount; i++) {
                    manualExcavateTop();
                }
                $(e.currentTarget).val('');
                return;
            }
            if (parts[0] === '/mill') {
                amount = parseInt(parts[1], 10);
                if (isNaN(amount)) {
                    return;
                }
                for (i = 0; i < amount; i++) {
                    manualMill();
                }
                $(e.currentTarget).val('');
                return;
            }

        }
        manualServer.send(JSON.stringify({
            action: 'chat',
            name: localStorage.nickname,
            chat: $(e.currentTarget).val(),
            sound: 'soundchatmessage'
        }));
        $(e.currentTarget).val('');
        $('.ingamechatbox, #sidechat').scrollTop($('.ingamechatbox').prop("scrollHeight"));
        return false;
    }
});

var friendsList = [];

$('#manualcontrols button').on('click', function () {
    'use strict';
    $('#revealed, #revealedclose').css('display', 'none');

});

$('body').on('mousedown', function (ev) {
    'use strict';
    if (ev.which === 3) {
        $('#manualcontrols button').css({
            'display': 'none'
        });
        attackmode = false;
    }
});