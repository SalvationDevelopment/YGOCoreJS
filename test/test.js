/* jshint node : true */
/* jshint mocha : true */


var assert = require('assert');
var net = require('net');
var fs = require('fs');
var net = require('net');
console.log('Running test');
var request = require('request');
var botScript = require('../botScript.js');
try {
    var server = require('../server/server.js');
    var offline = require('../client/interface/js/offline-server.js');
    var proxy = require('../server/http/js/proxy.js');
} catch (error) {
    console.log("fundemental issue!");
}
request('http://localhost:9467', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log('response ran');
    }
});
request('http://localhost:9467/index.html', function (error, response, body) {
    if (!error && response.statusCode == 200) {}
});
var playerconnect1 = new Buffer(require('./playerconnect1.js'));

server.startCore(9001, {
    hostString: 'game'
}, playerconnect1, server.connectToCore(9001, playerconnect1, {
    hostString: 'game'
}));
server.connectToCore(9001, playerconnect1, {
    hostString: 'game'
});
describe('YGOCore is assembled correctly', function () {
    it('YGOCore built', function () {
        assert((fs.existsSync('server/ygocore/YGOServer.exe')), true);
    });
    it('Card Database included', function () {
        assert((fs.existsSync('server/http/ygopro/cards.cdb')), true);
    });
    it('Ban List included', function () {
        assert((fs.existsSync('server/http/ygopro/lflist.conf')), true);
    });
    it('SQLite.dll included', function () {
        assert((fs.existsSync('server/ygocore/System.Data.SQLite.dll')), true);
    });
    it('OCGCOre built', function () {
        assert((fs.existsSync('server/ygocore/libocgcore.so') ||
            (fs.existsSync('server/ygocore/ocgcore.dll')), true));
    });
});
describe('Testing that Dependencies Load', function () {
    it('Loaded Objectifier', function () {
        var target = require('../server/libs/objectifier.js');
    });
    it('Loaded Packet Decoder', function () {
        var target = require('../server/libs/parsepackets.js');
    });
    it('Loaded Recieve Client to Server Message Marker', function () {
        var target = require('../server/libs/recieveCTOS.js');
        target({
            CTOS: 'CTOS_HS_READY'
        });
        target({
            CTOS: 'CTOS_HS_NOTREADY'
        });
        target({
            CTOS: 'CTOS_HS_TODUELIST'
        });
        target({
            CTOS: 'CTOS_HS_TOOBSERVER'
        });
        target({
            CTOS: 'CTOS_LEAVE_GAME'
        });
        target({
            CTOS: 'CTOS_HS_START'
        });

    });
    it('Loaded Recieve Server to Client Message Marker', function () {
        var target = require('../server/libs/recieveSTOC.js');
        target({
            STOC: 'test'
        });
    });
    it('Loaded Development/Stage/Production Markers', function () {
        var target = require('../server/libs/servercontrol.json');
        assert((target.production === 'http://salvationdevelopment.com/launcher/'), true);
    });
    it('Loaded Update System', function () {
        var target = require('../server/libs/update.js');
    });
});

describe('TOS & Licences are Included', function () {
    it('Terms of Service', function () {
        assert((fs.existsSync('../server/http/licence/sdlauncher-tos.text') !== null), true);
    });
    it('YGOPro', function () {
        assert((fs.existsSync('../server/http/licence/ygopro.txt') !== null), true);
    });
    it('Node-Webkit', function () {
        assert((fs.existsSync('../server/http/licence/node-webkit.txt') !== null), true);
    });
    it('Machinima Sound', function () {
        assert((fs.existsSync('../server/http/licence/machinimasound.text') !== null), true);
    });
    it('Fake Detection', function () {
        assert((fs.existsSync('../server/http/licence/sdlauncher-tos.text') !== null), false);
    });

});
describe('Structures Test', function () {
    var structureDefinition = require('../server/libs/objectifier.js');
    it('Structure Creation', function () {
        var header = {
            test: 'char',
            long: 'long'
        };
        var strut = structureDefinition(header);
        var out = strut.write({
            test: 'a',
            long: "abcd    "
        });
        var validate = strut.read(out);
        assert((validate.test === "a"), true);
        assert((validate.long === "abcd    "), true);
    });
});
offline('-j', function () {});
offline('-r', function () {});
offline('-d', function () {});
describe('Test Offline Server', function () {
    it('j attempt', function () {

    });
});
describe('Test Network Connection Methods', function () {

    before(function (done) {
        server.startCore(9001, {
            hostString: 'game'
        }, playerconnect1);
        var message = new Buffer(playerconnect1);
        var socket = net.createConnection(8911);
        socket.on('connect', function (connect) {


            socket.write(message);

        });
        var wsp = net.createConnection(8912);
        wsp.on('connect', function (connect) {

            wsp.write(message);
            var wsserver = net.createServer().listen(8003);
            var Primus = require('primus');
            var primus = new Primus(wsserver);
            var Socket = primus.Socket;

            var client = new Socket('http://localhost:5000');
            client.write({
                action: 'join'
            });

            setTimeout(function () {
                client.write({
                    action: 'leave'
                });
                console.log(assert(true, true));
                server.startCore(9001, {
                        hostString: 'game'
                    }, playerconnect1,
                    done());
            }, 100);
        });
    });
    it('TCP Connection Attempt', function (done) {
        done();
    });



});

/*
var structureDefinition = require('../objectifier.js');

var structureDefinition = require('../objectifier.js');
var header = {
    test: ['char', 10],
    long: 'long'
};
var strut = structureDefinition(header);
var out = strut.write({
    test: 'a123456789',
    long: "abcd    "
});
var validate = strut.read(out);
console.log(validate)
//console.log(validate.test.length, "a123456789".length, true);
//console.log(validate.long.length, "abcd    ".length, true);
console.log(validate.test, "a", true);
console.log(validate.long, "abcd    ", true);*/