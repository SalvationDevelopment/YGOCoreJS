/*jslint node:true, plusplus:true, bitwise : true, nomen:true*/
'use strict';


// review the following https://github.com/Fluorohydride/ygopro-core/blob/master/processor.cpp

var DRAW_PHASE = 0,
    STANDBY_PHASE = 1,
    MAIN_PHASE_1 = 2,
    BATTLE_PHASE = 3,
    MAIN_PHASE_2 = 4,
    END_PHASE = 5;

var waterfall = require('async-waterfall');
/*
    Action Object
    {
        command  : {Function}, required
        callback : {Function}, optional
        params   : {Array}     optional
    }
    Can be understood as:
    `command(params[0], params[1], etc..., callback);`
    
    When sending a question to the user, make sure to set a duel.responseEngine.once listener with a
    unique id to catch the response. Do not use `.on`.
*/

/**
 * Process a queue of actions (as defined by above Action Object).
 * @param {Array} actionQueue Array of action objects. Each contains a command and parameters.
 */
function processActionQueue(actionQueue, callback) {

    // waterfall takes a list of functions, we need to generate those functions.
    waterfall(actionQueue.map(function (action) {
        return function (lastActionResult, nextCallback) {
            var params = action.parameters || [],
                actionCallback = function (error, result) {
                    if (error) {
                        nextCallback(error);
                    } else {
                        if (typeof action.callback === 'function') {
                            action.callback(error, result);
                        }
                        nextCallback(null, true);
                    }
                };
            params.push(actionCallback);
            action.command.apply(params);
        };
    }), function () {
        if (typeof callback === 'function') {
            callback();
        }
    });
}



/**
 * Set the starting Lifepoints of a duel.
 * @param {object} duel Engine instance.
 * @param {number} lp   Number of Lifepoints to start with.
 */
function setLP(duel, lp) {
    duel.lp.forEach(function (currentLP, index) {
        duel.lp[index] = lp;
    });
}


/**
 * Do the automatic processsing of the draw phase. Start by emptying the queue then doing base logic.
 * @param {Object}   duel              Engine instance.
 * @param {Array} drawPhaseActionQueue The queue for the draw phase.
 * @param {Function} callback          Function to call to move onto next phase.
 */
function doDrawPhase(duel, drawPhaseActionQueue, callback) {

    if (duel.skipDrawPhase) {
        // kill everything in the draw phase queue. Skip it, but make sure it isnt around next turn.
        drawPhaseActionQueue.length = 0;
        callback();
        return;
    }

    duel.nextPhase(DRAW_PHASE);

    // Do any "on start of phase", actions first, then attempt to draw.
    processActionQueue(drawPhaseActionQueue, function () {
        var state = duel.state(),
            player = state.turnOfPlayer,
            turnCount = state.turnCount;

        if (turnCount && !state.skipDraw) {

            /* duel engine moves the card, then triggers its effects
               when its done it moves on. That is why the callback is passed. */

            duel.drawCard(player, 1, duel.playerName[player], function () {

                /* drawing a card may have added an action to the phase stack so do it again */
                processActionQueue(drawPhaseActionQueue, callback);
            });
        } else {
            processActionQueue(drawPhaseActionQueue, callback);
        }
    });
    return;
}

/**
 * Do the automatic processsing of the standby phase.
 * @param {Object}   duel                      Engine instance
 * @param {Array}    standbyPhaseActionQueue   The queue
 * @param {Function} callback                  Function to call to move onto next phase.
 */
function doStandbyPhase(duel, standbyPhaseActionQueue, callback) {
    if (duel.skipStandbyPhase) {
        // kill everything in the standby phase queue. Skip it, but make sure it isnt around next turn.
        standbyPhaseActionQueue.length = 0;
        callback();
        return;
    }


    duel.nextPhase(DRAW_PHASE);
    processActionQueue(standbyPhaseActionQueue, function () {
        callback();
    });
    return;
}

/**
 * Generate action list for main phases.
 * @param   {Object} duel Engine instance
 * @returns {Object} options that user can take.
 */
function getMainPhaseActions(duel) {
    return {
        normalsummonable: duel.query.getGroup({
            normalSummonable: true
        }),
        specialsummonable: duel.query.getGroup({
            specialsummonable: true
        }),
        canchangetodefense: duel.query.getGroup({
            canchangetodefense: true
        }),
        canactivatespelltrap: duel.query.getGroup({
            canactivate: true
        }),
        cansetmonster: duel.query.getGroup({
            cansetmonster: true
        }),
        cantributesummon: duel.query.getGroup({
            canTributeSummon: true
        }),
        cansetspelltrap: duel.query.getGroup({
            cansetspelltrap: true
        }),
        canactivategrave: duel.query.getGroup({
            canactivategrave: true
        }),
        canactivatebanished: duel.query.getGroup({
            canactivatebanished: true
        })
    };
}

/**
 * Do the automatic processsing of the main phase 1.
 * @param {Object}   duel                      Engine instance
 * @param {Array}    mainPhase1ActionQueue     The queue
 * @param {Function} callback                  Function to call to move onto next phase.
 */
function doMainPhase1(duel, mainPhase1ActionQueue, callback) {

    duel.nextPhase(MAIN_PHASE_1);

    function askUserNextAction() {
        processActionQueue(mainPhase1ActionQueue, function () {
            var state = duel.state(),
                player = state.turnOfPlayer,
                turnCount = state.turnCount,
                options = getMainPhaseActions(duel);


            duel.question({
                questionType: 'mainphase',
                battlephase: state.battlephaseAvaliable,
                endphase: state.endPhaseAvaliable,
                normalSummon: options.normalsummonable,
                specialSummon: options.specialsummonable,
                toDefense: options.canchangetodefense,
                setMonster: options.cansetmonster,
                activateSpellTrap: options.canactivatespelltrap,
                setSpellTrap: options.cansetspelltrap,
                pendulumSummon: state.pendulumnSummonAvaliable,
                player: state.turnOfPlayer

            }, function (error, answer) {
                switch (answer.action) {
                case 'battlephase':
                    callback();
                    break;
                case 'endphase':
                    duel.skipbattlephase = true;
                    duel.skipmainphase2 = true;
                    callback();
                    break;
                default:
                    askUserNextAction();
                    break;
                }
            });

        });
    }
    askUserNextAction();
    return;
}


/**
 * Do the automatic processsing of the battle phase.
 * @param {Object}   duel                      Engine instance
 * @param {Array}    battlePhaseActionQueue    The queue
 * @param {Function} callback                  Function to call to move onto next phase.
 */
function doBattlePhase(duel, battlePhaseActionQueue, callback) {

    if (duel.skipbattlephase) {
        // kill everything in the battle queue. Skip it, but make sure it isnt around next turn.
        battlePhaseActionQueue.length = 0;
        callback();
        return;
    }

    duel.nextPhase(BATTLE_PHASE);

    function askUserNextAction() {
        processActionQueue(battlePhaseActionQueue, function () {
            var state = duel.state(),
                player = state.turnOfPlayer,
                turnCount = state.turnCount,
                canattack = duel.query.getGroup({
                    canattack: true
                }),
                canactivate = duel.query.getGroup({
                    canactivate: true
                });

            duel.question({
                questionType: 'battlephase',
                attackOptions: canattack,
                activationOptions: canactivate,
                player: state.turnOfPlayer
            }, function (error, answer) {

                switch (answer.action) {
                case 'mainphase2':
                    callback();
                    break;
                case 'endphase':
                    duel.skipmainphase2 = true;
                    callback();
                    break;
                default:
                    askUserNextAction();
                    break;
                }
            });
        });
    }
    askUserNextAction();
    return;
}


/**
 * Do the automatic processsing of the main phase 2.
 * @param {Object}   duel                      Engine instance
 * @param {Array}    mainPhase2ActionQueue     The queue
 * @param {Function} callback                  Function to call to move onto next phase.
 */
function doMainPhase2(duel, mainPhase2ActionQueue, callback) {

    if (duel.skipmainphase2) {
        // kill everything in the main phase 2 queue. Skip it, but make sure it isnt around next turn.
        mainPhase2ActionQueue.length = 0;
        callback();
        return;
    }
    duel.nextPhase(MAIN_PHASE_2);

    function askUserNextAction() {
        processActionQueue(mainPhase2ActionQueue, function () {
            var state = duel.state(),
                player = state.turnOfPlayer,
                turnCount = state.turnCount,
                options = getMainPhaseActions(duel);


            duel.question({
                questionType: 'mainphase',
                battlephase: state.battlephaseAvaliable,
                endphase: state.endPhaseAvaliable,
                normalSummon: options.normalsummonable,
                specialSummon: options.specialsummonable,
                toDefense: options.canchangetodefense,
                setMonster: options.cansetmonster,
                activateSpellTrap: options.canactivatespelltrap,
                setSpellTrap: options.cansetspelltrap,
                pendulumSummon: state.pendulumnSummonAvaliable,
                player: state.turnOfPlayer
            }, function (error, answer) {
                switch (answer.action) {
                case 'endphase':
                    callback();
                    break;
                default:
                    askUserNextAction();
                    break;
                }
            });

        });
    }
    askUserNextAction();
    return;
}

/**
 * Do the automatic processsing of the end phase.
 * @param {Object}   duel                      Engine instance
 * @param {Array}    mainPhase1ActionQueue     The queue
 * @param {Function} callback                  Function to call go to setup the next turn.
 */
function doEndPhase(duel, endPhaseActionQueue, callback) {
    duel.nextPhase(END_PHASE);
    processActionQueue(endPhaseActionQueue, function () {
        duel.nextTurn();
        callback();
    });
    return;
}

/**
 * Initiate the duel
 * @param {object} duel   Engine instance (ygojs-core.js)
 * @param {object} params Object with a bunch of info to use as start up info.
 */
function init(duel, params) {
    var actionQueue = [],
        drawPhaseActionQueue = [],
        standbyPhaseActionQueue = [],
        mainPhase1ActionQueue = [],
        battlePhaseActionQueue = [],
        mainPhase2ActionQueue = [],
        endPhaseActionQueue = [];

    // load all cards


    // Set the starting Life Points
    actionQueue.push({
        command: setLP,
        params: [params.lifePoints]
    });

    // Set the starting Player
    actionQueue.push({
        command: duel.setTurnPlayer,
        params: [params.firstPlayer]
    });


    function setupTurn() {

        // main phase 2, and battle phase skips to be determined by other mechanisms that reset each turn.
        duel.skipmainphase2 = false;
        duel.skipbattlephase = false;


        // queue up each of the game phase.
        // each phase is "done" even if skipped by a card effect.
        // each phase processing function has a way of handling skips.

        actionQueue.push({
            command: doDrawPhase,
            params: [duel, drawPhaseActionQueue]
        });
        actionQueue.push({
            command: doStandbyPhase,
            params: [duel, standbyPhaseActionQueue]
        });
        actionQueue.push({
            command: doMainPhase1,
            params: [duel, mainPhase1ActionQueue]
        });
        actionQueue.push({
            command: doBattlePhase,
            params: [duel, battlePhaseActionQueue]
        });
        actionQueue.push({
            command: doMainPhase2,
            params: [duel, mainPhase2ActionQueue]
        });
        actionQueue.push({
            command: doDrawPhase,
            params: [duel, endPhaseActionQueue]
        });

        processActionQueue(actionQueue, function () {
            setTimeout(setupTurn);
        });
    }
    setupTurn();
}
module.exports = {
    init: init
};