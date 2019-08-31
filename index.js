"use strict";

var mpd = require('mpd');
var cmd = mpd.cmd;
let Service, Characteristic;

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-mpd-speaker", "MPD-SPEAKER", MPD_SPEAKER);
};

function MPD_SPEAKER(log, config) {
    this.log = log;

    this.name = config["name"] || 'MPD';
    this.host = config["host"] || 'localhost';
    this.port = config["port"] || 6600;
    
    this.client = mpd.connect({
      port: this.port,
      host: this.host,
    });

    this.volume = {};
    this.mute = {};
    this.power = { enabled: true };

    this.service = new Service.Fan(this.name);

    this.log("... adding on characteristic");
    this.service
        .addCharacteristic(new Characteristic.On())
        .on("get", this.getPowerState.bind(this))
        .on("set", this.setPowerState.bind(this));

    this.log("... adding volume characteristic");
    this.service
        .addCharacteristic(new Characteristic.RotationSpeed())
        .on("get", this.getVolume.bind(this))
        .on("set", this.setVolume.bind(this));
}

MPD_SPEAKER.prototype = {

    identify: function (callback) {
        this.log("Identify requested!");
        callback();
    },

    getServices: function() {
      return [this.service];
    }, 

    getMuteState: function (callback) {
        var accessory = this;

        this.client.sendCommand(cmd("status", []), function(err, msg) {
            if (err) {
              callback(err);
            }
            else {
              var response = mpd.parseKeyValueMessage(msg);
              var on = response.state == "play";
              accessory.log("player state: %s", response.state);
              callback(null, on);
            }
            
          });  
    },

    setMuteState: function (muted, callback) {
        this.log("Setting muted to " + muted);
  
        if (muted) {
          this.client.sendCommand(cmd("stop", []), function(err, msg) {
            if (err) {
              callback(err);
            }
            else {
              callback(null);
            } 
          });
        }
        else {
          this.client.sendCommand(cmd("play", []), function(err, msg) {
            if (err) {
              callback(err);
            }
            else {
              callback(null);
            } 
          });
        }
    },

    getPowerState: function (callback) {
        var accessory = this;

        this.client.sendCommand(cmd("status", []), function(err, msg) {
            if (err) {
              callback(err);
            }
            else {
              var response = mpd.parseKeyValueMessage(msg);
              var on = response.state == "play";
              accessory.log("player state: %s", response.state);
              callback(null, on);
            }
            
          });   
    },

    setPowerState: function (power, callback) {
        this.log("Setting power to " + power);
  
        if (power) {
          this.client.sendCommand(cmd("play", []), function(err, msg) {
            if (err) {
              callback(err);
            }
            else {
              callback(null);
            } 
          });
        }
        else {
          this.client.sendCommand(cmd("stop", []), function(err, msg) {
            if (err) {
              callback(err);
            }
            else {
              callback(null);
            } 
          });
        }
    },

    getVolume: function (callback) {

        var accessory = this;

        this.client.sendCommand(cmd("status", []), function(err, msg) {
          if (err) {
            callback(err);
          }
          else {
            var response = mpd.parseKeyValueMessage(msg);
            var volume = response.volume;
            accessory.log("volume is %s", volume);
            callback(null, Number(volume));
          }
          
        });
    },

    setVolume: function (volume, callback) {
        this.log("Setting volume to %s", volume);

        this.client.sendCommand(cmd("setvol", [volume]), function(err, msg) {
          if (err) {
            callback(err);
          }
          else {
            callback(null);
          }   
        });
    }

};