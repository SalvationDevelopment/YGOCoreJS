/* jslint node : true */

/* global localStorage, require */
//development, stage, production

var os = require('os');
var http = require('http');
var url = require('url');
var child_process = require('child_process');
var fs = require('fs');
var operating_system = os.platform();
console.log(process.execPath);
var platform = {
    darwin: './application_mac_ygopro',
    linux: './application_ygopro',
    win32: 'application_ygopro.exe',
    win64: 'application_ygopro.exe'
};
var executable = platform[operating_system] || 'ygopro';
console.log(operating_system, executable);
if (operating_system === 'linux' || operating_system === 'darwin') {
    fs.chmod('ygopro/' + executable, 0755, function (error) {
        if (error) console.log(error);
    }); // creates race condition requiring launcher restart.
}
var settings = ['use_d3d', 'antialias', 'errorlog', 'nickname', 'roompass', 'lastdeck', 'textfont', 'numfont', 'fullscreen', 'enable_sound',
'sound_volume', 'enable_music', 'music_volume', 'skin_index', 'auto_card_placing', 'random_card_placing', 'auto_chain_order', 'no_delay_for_chain',
'enable_sleeve_loading', 'serverport', 'lastip', 'textfontsize', 'lastport'];

try {
    var localStorageExist = localStorage;
} catch (e) {
    /*jshint -W020 */
    localStorage = {};

}
try {
    //require('nw.gui').Window.get().showDevTools();
} catch (error) {
    console.log('Cant open development tools');
}
try {
    var normal = true;
    var template = fs.readFileSync('./interface/template.ini', 'utf-8');
} catch (e) {
    var normal = false;
    var template = fs.readFileSync('./interface/template.ini', 'utf-8');
}
for (var i = 0; settings.length > i; i++) {
    if (!localStorageExist || !localStorage[settings[i]]) {
        localStorage.use_d3d = '0';
        localStorage.antialias = '0';
        localStorage.errorlog = '0';
        localStorage.nickname = 'Player';
        localStorage.roompass = '';
        localStorage.lastdeck = '';
        localStorage.textfont = 'simhei.ttf';
        localStorage.textfontsize = '12';
        localStorage.numfont = 'arialbd.ttf';
        localStorage.serverport = '8911';
        localStorage.lastip = '127.0.0.1';
        localStorage.lastport = '8911';
        localStorage.fullscreen = '0';
        localStorage.enable_sound = '1';
        localStorage.sound_volume = '100';
        localStorage.enable_music = '0';
        localStorage.music_volume = '100';
        localStorage.skin_index = '-1';
        localStorage.auto_card_placing = '1';
        localStorage.random_card_placing = '0';
        localStorage.auto_chain_order = '1';
        localStorage.no_delay_for_chain = '0';
        localStorage.enable_sleeve_loading = '0';
    }
}
console.log('Starting Offline Server');
http.createServer(function (request, response) {
    var parameter = url.parse(request.url);
    var letter = parameter.path.slice(-1);
    runYGOPro('-' + letter, function () {
        console.log('!', parameter.path);
    });
    response.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    response.end('');
}).listen(9467, '127.0.0.1');

function runYGOPro(mode, callback) {
    //console.log(template);
    var systemConf = template;

    function fillInData(form, placeholder, value) {
        form = form.replace(placeholder, value);
        return form;
    }
    for (var i = 0; settings.length > i; i++) {
        systemConf = fillInData(systemConf, '{' + settings[i] + '}', localStorage[settings[i]]);
    }
    var path = './ygopro/system.conf';
    fs.writeFile(path, systemConf, function (err) {
        if (err) {
            console.log('file permission error, cant edit ' + path);

        }
        console.log(mode);
        //console.log('It\'s saved!');
        try {
        var instance = child_process.execFile(executable, [mode], {
            cwd: (process.execPath.replace('launcher.exe', 'ygopro'))
        }, function (error) {
            if (error !== null) {
                //write crash report;
                console.log('YGOPro Crashed');
                var filelocation = 'crash_report_YGOPro_' + (new Date().toDateString) + '.log';
                fs.writeFile(filelocation, error, function () {});
            }
            //            fs.readFile(__dirname + '/../../ygopro/system.conf', function (error, file) {
            //                if (error !== null) {
            //                    console.log('file permission error, cant read system.conf');
            //                    throw err;
            //                }
            //                console.log("file os =", file, typeof file);
            //                var options = file.split('\r\n');
            //                console.log(options);
            //            });
        });
        }catch(error){
            var inform = confirm(executable+' is not executable, it likely doesnt exist; Would you like more information?');
            if (inform){
                alert('If on Windows let the launcher keep downloading till it gets to application_ygopro.exe, the program is not on your computer. The automatic update system will figure this out and correct this error so just wait till this file is downloaded along with its dependencies.');
            }
        }
      
    });
}

function fileError(mainError){
    var filename = 'errorReport' + (new Date().toDateString) + '.log';
    fs.writeFile(filename, mainError, function () {});        
} 
