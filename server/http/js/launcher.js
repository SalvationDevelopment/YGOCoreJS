/* jslint node : true */
/* jslint browser : true */
/* global ygopro, $, isChecked, alert, Primus, console, process, applySettings, prompt, confirm */
/* exported joinGamelist, leaveGamelist, hostGame, connectgamelist, enterGame, setHostSettings, gui*/
applySettings();
var siteLocation = 'http://ygopro.us/';
var os = require('os');
process.on('uncaughtException', function (err) {
    console.log(err);
    alert('An error occured,... That hurt T.T; Stop hitting me!');
});
var http = require('http');
var fs = require('fs');
var url = require('url');
var gui = require('nw.gui');
//var unzip = require('unzip');

var manifest = '';
var options = {
    host: url.parse('http://ygopro.us/manifest/ygopro.json').host,
    port: 80,
    path: url.parse('http://ygopro.us/manifest/ygopro.json').pathname
};
fs.unlink('ygopro.zip', function () {});

function createmanifest() {
    http.get(options, function (res) {
        res.on('data', function (data) {
            manifest = manifest + data;
            screenMessage.text('Downloading manifest');
        }).on('end', function () {
            try {
                manifest = JSON.parse(manifest);
            } catch (error) {
                screenMessage.text('Failed to get update manifest.');
            }
            updateCheckFile(manifest, true);

        });
    });
}
createmanifest();

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
});
var completeList = [];


function updateCheckFile(file, initial) {
    screenMessage.text('Processing manifest');
    if (file.type !== 'folder') {

        completeList.push(file);
    } else if (file.type === 'folder') {
        for (var i = 0; file.subfolder.length > i; i++) {
            try {
                fs.mkdirSync(file.path);
            } catch (e) {}
            updateCheckFile(file.subfolder[i], false);
        }

    }
    if (initial) {
        console.log(completeList);
        hashcheck();
    }
}
var screenMessage = $('#servermessages');

var downloadList = [];

function hashcheck() {
    if (completeList.length === 0) {
        download();
    }
    var target = completeList[0];
    if (target) {
        if (target.path) {
            fs.stat(target.path, function (err, stats) {
                if (err) {
                    //bad file keep going and add it.
                    downloadList.push(target);
                    completeList.shift();
                    hashcheck();
                    return;
                }
                //screenMessage.text('Analysing...' + target.path);

                if (stats.size !== target.size) {
                    //console.log(stats.size, target.checksum, target.path);
                    downloadList.push(target);
                }
                completeList.shift();
                hashcheck();
            });
        }
    }
}

function download() {
    if (downloadList.length === 0) {
        screenMessage.text('Update Complete! System Messages will appear here.');
        if (os.platform() === 'linux') {
            fs.chmod('ygopro/application_ygopro', 0755, function (error) {
                if (error) console.log(error);
            }); // creates race condition requiring launcher restart.
        }
        return;
    }
    var target = downloadList[0];
    var additionaltext = '.';
    if (downloadList.length > 250) {
        additionaltext = ', this will take a while please be patient!';
    }
    screenMessage.text('Updating...' + target.path + ' and ' + downloadList.length + ' other files' + additionaltext);

    var file = fs.createWriteStream(target.path);
    var options = {
        host: url.parse(siteLocation + target.path).host,
        port: 80,
        path: url.parse(siteLocation + target.path).pathname
    };
    http.get(options, function (res) {
        res.on('data', function (data) {
            file.write(data);
        }).on('end', function () {
            file.end();
            downloadList.shift();
            setTimeout(function () {
                download();
            }, 0);

        });
    });
}

$('#servermessages').text('Server Messages will spawn here.');


var primus = Primus.connect('http://salvationdevelopment.com:24555');

function joinGamelist() {
    primus.write({
        action: 'join'
    });
}

function leaveGamelist() {
    primus.write({
        action: 'leave'
    });
}

function hostGame(parameters) {
    primus.write({
        serverEvent: 'hostgame',
        format: parameters
    });
}


function randomString(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomstring = '';
    for (var i = 0; i < len; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomstring += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomstring;
}

function getDuelRequest() {
    return {
        string: "" + $('#creategamecardpool').val() + $('#creategameduelmode').val() + $('#creategametimelimit').val(),
        prio: isChecked('#enableprio') ? ("F") : ("O"),
        checkd: isChecked('#discheckdeck') ? ("F") : ("O"),
        shuf: isChecked('#disshuffledeck') ? ("F") : ("O"),
        stnds: "," + $('#creategamebanlist').val() + ',5,1,U,',
        pass: randomString(5)
    };
}

function setHostSettings() {

    var duelRequest = getDuelRequest();
    localStorage.roompass =
        duelRequest.string + duelRequest.prio +
        duelRequest.checkd + duelRequest.shuf +
        $('#creategamelp').val() + duelRequest.stnds +
        duelRequest.pass;

    localStorage.lastip = '192.99.11.19';
    localStorage.serverport = '8911';
    localStorage.lastport = '8911';

    if (!secure(duelRequest.prio, duelRequest.checkd, duelRequest.shuf)) {
        return;
    }

    locallogin();
    ygopro('-j');
}

function secure(prio, checkd, shuf) {
    if (prio + checkd + shuf !== "OOO" && $('input:radio[name=ranked]:checked').val() === 'R') {
        alert('You may not cheat here.');
        return false;
    }
    if ($('#creategamecardpool').val() === 2 && $('input:radio[name=ranked]:checked').val() === 'R') {
        alert('OCG/TCG is not a valid mode for ranked, please select a different mode for ranked play');
        return false;
    }
    return true;
}

function connectgamelist() {
    primus.write({
        action: 'join'
    });
}
primus.on('data', function (data) {
    console.log(data);
    if (!data.clientEvent) {
        renderList(JSON.parse(data));
    }
    switch (data.clientEvent) {
    case ('serverMessage'):
        {
            $('#servermessages').text(data.serverMessage);
        }
        break;

    case ('duelRequest'):
        {
            var accept = prompt('Take duel?');
            if (accept) {
                enterGame(data.clientEvent.room);
            }
        }
        break;

    case ('die'):
        {
            alert(data.clientEvent.message);
            $('body').html('');
        }
        break;

    }
});



function parseDuelOptions(duelOptions) {
    var duelOptionsParts = duelOptions.split(',');

    var settings = { //Determine time limit
        timeLimit: (duelOptionsParts[0][2] === '0') ? '3 minutes' : '5 minutes',
        //Use classic TCG rules?
        isTCGRuled: (duelOptionsParts[0][3] === 'O') ? 'OCG rules' : 'TCG Rules',

        //Check Deck for Illegal cards?
        isDeckChecked: (duelOptionsParts[0][4] === 'O') ? 'Check' : 'Dont Check',

        //Shuffle deck at start?
        isShuffled: (duelOptionsParts[0][5] === 'O') ? 'Shuffle' : 'Dont Shuffle',

        //Choose Starting Life Points
        lifePoints: duelOptionsParts[0].substring(6),

        //Determine Banlist
        banList: parseInt(duelOptionsParts[1], 10),

        //Select how many cards to draw on first hand
        openDraws: duelOptionsParts[2],

        //Select how many cards to draw each turn
        turnDraws: duelOptionsParts[3],

        //Choose whether duel is ranked
        isRanked: (duelOptionsParts[4] === 'U') ? 'Unranked' : 'Ranked',

        //Copy password
        password: duelOptionsParts[5],
    };


    //Determine allowed cards
    if (duelOptionsParts[0][0] === '0') {
        settings.allowedCards = 'tcg';
    }
    if (duelOptionsParts[0][0] === '1') {
        settings.allowedCards = 'ocg';
    }
    if (duelOptionsParts[0][0] === '2') {
        settings.allowedCards = 'tcg/ocg';
    }

    //Determine game mode
    if (duelOptionsParts[0][1] === '0') {
        settings.gameMode = 'single';
    }
    if (duelOptionsParts[0][1] === '1') {
        settings.gameMode = 'match';
    }
    if (duelOptionsParts[0][1] === '2') {
        settings.gameMode = 'tag';
    }

    if (settings.gameMode === 'single' ||
        settings.gameMode === 'match') {

    }

    return settings;



}

//{"200OOO8000,0,5,1,U,PaS5w":{"port":8000,"players":[],"started":false}}

function enterGame(string) {
    localStorage.roompass = string;
    ygopro('-j');
}
//primus.write({
//    action: 'join'
//});
var banlist_names = ['TCG-Current', 'OCG-Current', 'Something older'];

function renderList(JSONdata) {
    $('#gamelist').html('');
    for (var rooms in JSONdata) {
        if (JSONdata.hasOwnProperty(rooms)) {
            var player1 = JSONdata[rooms].players[0] || '___';
            var player2 = JSONdata[rooms].players[2] || '___';
            var player3 = JSONdata[rooms].players[3] || '___';
            var player4 = JSONdata[rooms].players[4] || '___';
            var duelist;
            var translated = parseDuelOptions(rooms);
            if (translated.gameMode === 'single' ||
                translated.gameMode === 'match') {
                duelist = player1 + ' vs ' + player2;
            } else {
                duelist = player1 + '&amp' + player2 + ' vs ' + player3 + '&amp' + player4;
            }
            console.log(translated);
            var content = '<div class="game" onclick=enterGame("' + rooms + '")>' +
                duelist + '<span class="subtext" style="font-size:.5em"><br>' + translated.allowedCards + '  ' + translated.gameMode +
                ' ' + banlist_names[translated.banlist] + '</span></div>';

            $('#gamelist').append(content);
        }
    }

}

function locallogin(init) {
    localStorage.nickname = localStorage.nickname || '\u0000\r\n';
    if (localStorage.nickname) {
        if (localStorage.nickname.indexOf('\u0000') < 1 || init === true) {
            var username = prompt('Username: ', localStorage.nickname);
            while (!username) {
                username = prompt('Username: ', localStorage.nickname);
            }
            localStorage.nickname = username + '\u0000\r\n';
        }
    }
}
$(document).on('ready', function () {

    locallogin(true);
});
