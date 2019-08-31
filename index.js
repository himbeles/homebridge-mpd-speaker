"use strict";

let Service, Characteristic;
var mpd = require('mpd');
var cmd = mpd.cmd;

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

    const service = new Service.Speaker(this.name);

    if (this.power.enabled) { // since im able to power off/on my speaker i decided to add the option to add the "On" Characteristic
            this.log("... adding on characteristic");
            service
                .addCharacteristic(new Characteristic.On())
                .on("get", this.getPowerState.bind(this))
                .on("set", this.setPowerState.bind(this));
        }

    this.log("... configuring mute characteristic");
    service
        .getCharacteristic(Characteristic.Mute)
        .on("get", this.getMuteState.bind(this))
        .on("set", this.setMuteState.bind(this));

    this.log("... adding volume characteristic");
    service
        .addCharacteristic(new Characteristic.Volume())
        .on("get", this.getVolume.bind(this))
        .on("set", this.setVolume.bind(this));

    const informationService = new Service.AccessoryInformation();

    informationService
        .setCharacteristic(Characteristic.Manufacturer, "himbeles")
        .setCharacteristic(Characteristic.Model, "MPD Speaker")
        .setCharacteristic(Characteristic.SerialNumber, "SP01")
        .setCharacteristic(Characteristic.FirmwareRevision, "1.0.0");
    
    this.log("... information service was set");
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