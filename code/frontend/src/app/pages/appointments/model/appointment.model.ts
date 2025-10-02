export class Appointment {
  "id": number;
  "name": string;
  "description": string;
  "schedule": string;
  "enabled": boolean;
  "development": boolean;
  "monitoringNumbers": string[];
  "monitoringGroups": boolean;
  "monitoringGroupsIds": string[];
  "enpoint": string;
  "retries": number;
  "timeout": number;
  "startDate": Date;
  "endDate": Date;
  "message": string;
  "sendTo": string[];
  "sendToGroups": string[];
  "recipientType": string;
}
