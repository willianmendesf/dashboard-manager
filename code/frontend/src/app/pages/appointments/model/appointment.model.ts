export class Appointment {
  "id": number;
  "name": string;
  "description": string;
  "schedule": string;
  "enabled": boolean;
  "development": boolean;
  "monitoringNumbers": [];
  "monitoringGroups": boolean;
  "monitoringGroupsIds": [];
  "enpoint": string;
  "retries": number;
  "timeout": number;
  "startDate": Date;
  "endDate": Date;
  "message": String
}
