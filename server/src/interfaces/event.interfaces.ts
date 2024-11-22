interface WorkItemDrop {
  type: 'workItem';
  workItemId: string;
  techId: string;
  startTime: Date;
}

interface EventDrop {
  type: 'scheduleEntry';
  eventId: string;
  techId: string;
  startTime: Date;
}

export type DropEvent = WorkItemDrop | EventDrop;
