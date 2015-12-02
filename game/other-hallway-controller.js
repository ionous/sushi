'use strict';

define({
  'other-hallway-controller': function(
    PlayerService, $log) {

    var player = PlayerService.getPlayer();
    var lastRoom = player.attr['actors-last-room'];
    if (!lastRoom) {
      // last room is defined in sash-alice/hallway/otherHallway.go
      throw new Error("missing last room");
    }

    // add a fake state to get alice to appear in a good position.
    if (lastRoom == "science-lab" || lastRoom == "ScienceLab") {
      player.changeState("fromLab", "fromAutomat");
    } else {
      player.changeState("fromAutomat", "fromLab");
    }
    $log.info("OtherHallway: player states", player.attr, player.states);
  }
});
