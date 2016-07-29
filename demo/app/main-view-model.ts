import observable = require("data/observable");
import {BackgroundGeolocation} from "nativescript-background-geolocation-lt";
import {fonticon} from 'nativescript-fonticon';
import Platform = require('platform');

var mapsModule = require("nativescript-google-maps-sdk");
var Color = require("color").Color;

const ICON_PLAY = "ion-play";
const ICON_PAUSE = "ion-pause";

require("globals");

const ICONS = {
  activity_unknown: 'ion-ios-help',
  activity_still: 'ion-man',
  activity_on_foot: 'ion-android-walk',
  activity_walking: 'ion-android-walk',
  activity_running: 'ion-android-walk',
  activity_in_vehicle: 'ion-android-car',
  activity_on_bicycle: 'ion-android-bicycle'
};

export class HelloWorldModel extends observable.Observable {

  private _counter: number;
  private _message: string;
  private _bgGeo: BackgroundGeolocation;
  private _state: any;
  private _enabled: boolean;
  private _isMoving: boolean;
  private _locationData: string = "DEFAULT";
  private _emptyFn: Function;
  private _paceButtonIcon = ICON_PLAY;
  private _odometer: string = '1000';
  private _activityType: string = '';
  private _activityIcon: string = ICONS.activity_still

  private _providerGps: string = "visible";
  private _providerWifi: string = "visible";
  private _providerDisabled: string = "visible";

  private _mapView: any;
  private _zoom = 15;
  private _polyline;

  public onMapReady(args) {  
    this._mapView = args.object;
    this._polyline = new mapsModule.Polyline();
    this._polyline.color = new Color('#bf2677FF');
    this._polyline.geodesic = true;
    this._polyline.width = 4;
    this._mapView.addPolyline(this._polyline);
  }


  get activityType(): string {
    return this._activityType;
  }
  set activityType(value:string) {
    if (value === 'unknown') {
      value = (this._isMoving) ? 'moving' : 'still';
    }
    value = value;
    this._activityType = value;
    this.notifyPropertyChange("activityType", value);
  }

  get activityIcon(): string {
    return this._activityIcon;
  }
  set activityIcon(value:string) {
    if (value === 'unknown') {
      value = (this._isMoving) ? 'moving' : 'still';
    }
    value = value;
    this._activityIcon = value;
    this.notifyPropertyChange("activityIcon", value);
  }

  get providerGps(): string {
    return this._providerGps;
  }
  set providerGps(value:string) {
    this._providerGps = value;
    this.notifyPropertyChange("providerGps", value);
  }

  get providerWifi(): string {
    return this._providerWifi;
  }
  set providerWifi(value:string) {
    this._providerWifi = value;
    this.notifyPropertyChange("providerWifi", value);
  }

  get providerDisabled(): string {
    return this._providerDisabled;
  }
  set providerDisabled(value:string) {
    this._providerDisabled = value;
    this.notifyPropertyChange("providerDisabled", value);
  }

  get odometer(): string {
    return this._odometer;
  }
  set odometer(value:string) {
    if (this._odometer !== value) {
      this._odometer = value;
      this.notifyPropertyChange("odometer", value);
    }
  }
  get isMoving(): boolean {
    return this._isMoving;
  }
  set isMoving(value:boolean) {
    if (this._isMoving !== value) {
      this._isMoving = value;
      this.notifyPropertyChange("isMoving", value);
    }
  }
  get isEnabled(): boolean {
    return this._enabled;
  }
  set isEnabled(value:boolean) {
    if (this._enabled !== value) {
      this._enabled = value;
      if (value) {
        this._bgGeo.resetOdometer();
        this._bgGeo.start();
        this.set('zoom', this._zoom);
      } else {
        this._bgGeo.stop();
        this.activityType = "off";
        this._mapView.removeAllMarkers();
        this._polyline.removeAllPoints();
      }
    }
    this.notifyPropertyChange("isEnabled", value);

  }
  set locationData(value: string) {
    if (this._locationData !== value) {
      value = '<pre>' + value + '</pre>';
      this._locationData = value;
      this.notifyPropertyChange("locationData", value);
    }        
  }
  get locationData(): string {
    return this._locationData;
  }

  get paceButtonIcon(): string {
    return this._paceButtonIcon;
  }

  set paceButtonIcon(value:string) {
    if (this._paceButtonIcon !== value) {
      this._paceButtonIcon = value;
      this.notifyPropertyChange("paceButtonIcon", value);
    }
  }
  constructor() {
    super();
    this._bgGeo = new BackgroundGeolocation();

    this._emptyFn = function(){};

    this._bgGeo.on('location', this.onLocation.bind(this), this.onLocationError.bind(this));
    this._bgGeo.on('motionchange', this.onMotionChange.bind(this));
    this._bgGeo.on('activitychange', this.onActivityChange.bind(this));
    this._bgGeo.on('http', this.onHttp.bind(this));
    this._bgGeo.on('heartbeat', this.onHeartbeat.bind(this));
    this._bgGeo.on('schedule', this.onSchedule.bind(this));
    this._bgGeo.on('providerchange', this.onProviderChange.bind(this));

    this._bgGeo.configure(this.getConfig(), function(state) {
      this._state = state;
      this._enabled = state.enabled;
      this.notifyPropertyChange("isEnabled", state.enabled);
      this._isMoving  = this._state.isMoving;
    }.bind(this));

    this.providerGps = 'visible';
    this.providerWifi = 'visible';
    this.providerDisabled = 'collapsed';

    console.log(this._state);
  }

  private getConfig() {
    return {
      // Geolocation
      desiredAccuracy: 0,
      distanceFilter: 50,
      locationUpdateInterval: 1000,
      // Activity Recognition
      stopTimeout: 1,
      stationaryRadius: 25,
      activityRecognitionInterval: 10000,
      // Application
      license: "88457817dcffc2cd2258565a72eeb5f9452903c38d7672b74d9d0a4a0c72eddd",
      foregroundService: true,
      debug: true,
      preventSuspend: false,
      heartbeatInterval: 60,
      // Http
      url: 'http://192.168.11.100:8080/locations',
      params: {
        device: {
          platform: Platform.device.deviceType,
          manufacturer: Platform.device.manufacturer,
          model: Platform.device.model,
          version: Platform.device.osVersion,
          uuid: Platform.device.uuid
        }
      },
      autoSync: false,
      maxRecordsToPersist: 100
    }
  }

  public onSetConfig() {
    var config = {
      distanceFilter: 10,
      stationaryRadius: 500
    };
    this._bgGeo.setConfig(config);
  }

  public onChangePace(ev) {
    this._isMoving = !this._isMoving;
    this._bgGeo.changePace(this._isMoving);
    this.paceButtonIcon = (this._isMoving) ? ICON_PAUSE : ICON_PLAY;
  }

  public onGetCurrentPosition() {
    var bgGeo = this._bgGeo;
    bgGeo.getCurrentPosition(function(location) {
      console.log('[js] getCurrentPosition: ', location);
    }.bind(this), function(error) {
      console.warn('[js] getCurrentPosition FAIL: ', error);
    }.bind(this), {
      timeout: 10,
      samples: 3,
      desiredAccuracy: 10,
      persist: false
    });
  }


  public onLocation(location:any) {
    //location = this._bgGeo.toObject(location);

    var bgGeo = this._bgGeo;
    var json = JSON.stringify(location, null, 2);
    console.info('[js] location: ', json);

    this.activityType = location.activity.type;        
    this.locationData = json;

    if (!location.sample) {
      this.odometer = (location.odometer/1000).toFixed(1);

      var position = mapsModule.Position.positionFromLatLng(location.coords.latitude, location.coords.longitude);
      var marker = new mapsModule.Marker();
      marker.position = position;
      marker.title = "Position";
      marker.snippet = location.timestamp;
      //marker.icon = 'markers/green-dot';
      marker.flat = true;
      marker.anchor = [0.5, 0.5];

      marker.userData = { index : location.uuid};
      this._mapView.addMarker(marker);
      this._polyline.addPoint(position);
    }
    this.set('latitude', location.coords.latitude);
    this.set('longitude', location.coords.longitude);

    bgGeo.getCount(function(count) {
      console.log('- count: ', count);
    });
  }

  public onLocationError(error:any) {
    console.error('- onLocationError: ', error);
  }

  public onMotionChange(isMoving:boolean, location: any) {
    //location = this._bgGeo.toObject(location);

    console.info('[js] motionchange', isMoving, location);
    this.isMoving = isMoving;
    this.activityType = location.activity.type;
    this.paceButtonIcon = (isMoving) ? ICON_PAUSE : ICON_PLAY;
    this.set('zoom', 15);
  }

  public onActivityChange(activityType:string) {
    this.activityIcon = ICONS['activity_' + activityType];
  }
  
  public onProviderChange(provider:any) {
    this.providerDisabled = (provider.enabled) ? 'collapsed' : 'visible';
    this.providerWifi = (provider.enabled && provider.network) ? 'visible' : 'collapsed';
    this.providerGps = (provider.enabled && provider.gps) ? 'visible' : 'collapsed';
  }

  public onHttp(response:any) {
    console.info('[js] http: ', response);
  }

  public onHeartbeat(params: any) {
    console.info('[js] heartbeat: ', params);
  }

  public onSchedule(state: any) {
    console.info('[js] schedule: ', state);
  }

  public onError(errorCode: number) {
    console.warn('[js] error: ', errorCode);
  }
}