import {
  collection,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { StatusConfig, CustomStatus } from '@/types/status';
import { DEFAULT_STATUSES } from '@/types/status';

const SETTINGS_COLLECTION = 'settings';
const STATUS_DOC_ID = 'statuses';

/**
 * Generate a unique ID for a status
 */
function generateStatusId(): string {
  return `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the status configuration, creating default if not exists
 */
export async function getStatusConfig(): Promise<StatusConfig> {
  const docRef = doc(db, SETTINGS_COLLECTION, STATUS_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as StatusConfig;
  }

  // Create default configuration
  const defaultConfig: Omit<StatusConfig, 'id'> = {
    statuses: DEFAULT_STATUSES.map((s) => ({
      ...s,
      id: generateStatusId(),
    })),
    updatedAt: Timestamp.now(),
    updatedBy: 'system',
  };

  await setDoc(docRef, defaultConfig);
  return { id: STATUS_DOC_ID, ...defaultConfig };
}

/**
 * Save the status configuration
 */
export async function saveStatusConfig(
  statuses: CustomStatus[],
  updatedBy: string = 'current-user'
): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, STATUS_DOC_ID);
  await setDoc(docRef, {
    statuses,
    updatedAt: Timestamp.now(),
    updatedBy,
  });
}

/**
 * Add a new status
 */
export async function addStatus(
  config: StatusConfig,
  status: Omit<CustomStatus, 'id'>
): Promise<StatusConfig> {
  const newStatus: CustomStatus = {
    ...status,
    id: generateStatusId(),
  };

  const updatedStatuses = [...config.statuses, newStatus];
  await saveStatusConfig(updatedStatuses);

  return {
    ...config,
    statuses: updatedStatuses,
    updatedAt: Timestamp.now(),
  };
}

/**
 * Update an existing status
 */
export async function updateStatus(
  config: StatusConfig,
  statusId: string,
  updates: Partial<Omit<CustomStatus, 'id'>>
): Promise<StatusConfig> {
  const updatedStatuses = config.statuses.map((s) =>
    s.id === statusId ? { ...s, ...updates } : s
  );
  await saveStatusConfig(updatedStatuses);

  return {
    ...config,
    statuses: updatedStatuses,
    updatedAt: Timestamp.now(),
  };
}

/**
 * Delete a status
 */
export async function deleteStatus(
  config: StatusConfig,
  statusId: string
): Promise<StatusConfig> {
  const updatedStatuses = config.statuses.filter((s) => s.id !== statusId);
  await saveStatusConfig(updatedStatuses);

  return {
    ...config,
    statuses: updatedStatuses,
    updatedAt: Timestamp.now(),
  };
}

/**
 * Reorder statuses within a category
 */
export async function reorderStatuses(
  config: StatusConfig,
  category: string,
  orderedIds: string[]
): Promise<StatusConfig> {
  const updatedStatuses = config.statuses.map((s) => {
    if (s.category === category) {
      const newOrder = orderedIds.indexOf(s.id);
      return { ...s, order: newOrder >= 0 ? newOrder : s.order };
    }
    return s;
  });

  await saveStatusConfig(updatedStatuses);

  return {
    ...config,
    statuses: updatedStatuses,
    updatedAt: Timestamp.now(),
  };
}
