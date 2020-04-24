import { Component } from '@angular/core';

import { ConfigService } from 'src/app/services/config/config.service';
import { IClientOptions } from 'mqtt';
import { MqttService } from 'src/app/services/mqtt/mqtt.service';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data/data.service';

@Component({
  selector: 'app-boot',
  templateUrl: './boot.page.html',
  styleUrls: ['./boot.page.scss']
})
export class BootPage {
  // 0 = non eseguito, 1 = ok, 2 = errore
  networkConnectionState = 0;
  mqttBrokerConnectionState = 0;

  private config;
  private mqttClient: MqttService;

  constructor(
    // private connectionService: ConnectionService, 
    private router: Router, 
    private configService: ConfigService,
    private dataService: DataService) {
    this.checkConnection();
  }

  public checkConnection() : void {
    
    this.config = this.configService.getConfig();
    // Check network connection
    // this.connectionService.monitor().subscribe(isConnected => {
    //   if(isConnected) this.networkConnectionState = 1;
    //   else this.networkConnectionState = 2;
    // })
    if(navigator.onLine) this.networkConnectionState = 1;
    else this.networkConnectionState = 2;

    // Check MQTT broker connection if network connection is present
    if(this.networkConnectionState == 1) {
      const options: IClientOptions = {
        hostname: this.config.project.mqttConnectionOptions.mqttBrokerAddress,
        port: Number(this.config.project.mqttConnectionOptions.mqttBrokerWebsocketPort),
        //clientId: uuid.v4(),
        clientId: 'sadsbdadsabdjh',
        username: this.config.project.mqttConnectionOptions.mqttUsername,
        password: this.config.project.mqttConnectionOptions.mqttPassword,
        protocol: 'wss'
      };

      // console.log(options);

      console.log('Connecting to broker...');

      this.mqttClient = new MqttService(this.dataService);
      this.mqttClient.setOnSuccess(() => {
        console.log("onSuccess");
        this.mqttBrokerConnectionState = 1;
        this.subscribeToStateTopics();
        this.router.navigate(['dashboard']);
      });
      this.mqttClient.setOnMessageArrived(this.onMessageArrived);
      this.mqttClient.connect(options);

      console.log('Connected to broker.');
    }
  }

  private subscribeToStateTopics() {
    this.config.project.floors.forEach(floor =>
      floor.rooms.forEach(room =>
        room.devices.forEach(device => {
          const topic = floor.label.replace(' ', '_') + '/' +
            room.label.replace(' ', '_') + '/' +
            device.label.replace(' ', '_') + '/' +
            device.groupAddresses[0].addressStatus;
          console.log(topic);
          this.mqttClient.subscribe(topic);
        })
      )
    );
  }

  private onMessageArrived(topic: string, message: string, dataService: DataService): void {
    console.log(this.dataService);
    dataService.update(topic, message);
  }
}