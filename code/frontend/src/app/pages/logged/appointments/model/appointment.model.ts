export class Appointment {
  "id": number;
  "name": string;
  "description": string;
  "schedule": string;
  "enabled": boolean;
  "development": boolean;
  "monitoring": boolean;
  "monitoringNumbers": string[];
  "monitoringGroups": boolean;
  "monitoringGroupsIds": string[];
  "endpoint": string;
  "retries": number;
  "timeout": number;
  "startDate": Date;
  "endDate": Date;
  "message": string;
  "sendTo": string[];
  "sendToGroups": string[];
  "recipientType": string;
  "taskType": string;
  "sendImage": boolean;
  "imageToSend": string;
}
