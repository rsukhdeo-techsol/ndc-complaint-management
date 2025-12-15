import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  runTransaction,
  QueryConstraint,
  increment,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import {
  Complaint,
  TimelineEntry,
  ComplaintStatus,
  CreateComplaintInput,
  UpdateComplaintInput,
  AddCommentInput,
  StatusChangeInput,
  AssignmentInput,
  AddAttachmentInput,
} from '@/types';
import { generateReferenceNumber } from '../utils';

// ============================================
// COMPLAINT CRUD OPERATIONS
// ============================================

/**
 * Create a new complaint
 */
export async function createComplaint(input: CreateComplaintInput): Promise<Complaint> {
  // Get the next reference number using a transaction
  const complaint = await runTransaction(db, async (transaction) => {
    // Get current complaint count for reference number
    // In production, you might use a counter document for this
    const complaintsRef = collection(db, COLLECTIONS.COMPLAINTS);
    const countQuery = query(complaintsRef, orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(countQuery);
    
    let sequenceNumber = 1;
    if (!snapshot.empty) {
      const lastComplaint = snapshot.docs[0].data() as Complaint;
      // Extract number from reference: NDC-2025-0001 -> 1
      const match = lastComplaint.referenceNumber.match(/NDC-\d{4}-(\d+)/);
      if (match) {
        sequenceNumber = parseInt(match[1], 10) + 1;
      }
    }
    
    const now = Timestamp.now();
    const newComplaintRef = doc(complaintsRef);
    
    // Build complaint data, filtering out undefined values (Firestore rejects undefined)
    const complaintData: Record<string, unknown> = {
      referenceNumber: generateReferenceNumber(sequenceNumber),
      complainantName: input.complainantName,
      title: input.title,
      description: input.description,
      source: input.source,
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy,
    };

    // Only add optional fields if they have values
    if (input.complainantPhone) complaintData.complainantPhone = input.complainantPhone;
    if (input.complainantEmail) complaintData.complainantEmail = input.complainantEmail;
    if (input.complainantAddress) complaintData.complainantAddress = input.complainantAddress;
    if (input.category) complaintData.category = input.category;
    if (input.location) complaintData.location = input.location;
    if (input.respondentName) complaintData.respondentName = input.respondentName;
    if (input.attachments && input.attachments.length > 0) complaintData.attachments = input.attachments;
    if (input.priority) complaintData.priority = input.priority;
    
    transaction.set(newComplaintRef, complaintData);
    
    // Add initial timeline entry for creation
    const timelineRef = collection(newComplaintRef, COLLECTIONS.TIMELINE);
    const timelineEntryRef = doc(timelineRef);
    
    const timelineEntry: Omit<TimelineEntry, 'id'> = {
      type: 'status_change',
      newStatus: 'submitted',
      statusNote: 'Complaint submitted',
      createdAt: now,
      createdBy: input.createdBy,
    };
    
    transaction.set(timelineEntryRef, timelineEntry);
    
    return {
      id: newComplaintRef.id,
      ...complaintData,
    } as Complaint;
  });
  
  return complaint;
}

/**
 * Get a complaint by ID
 */
export async function getComplaint(complaintId: string): Promise<Complaint | null> {
  const docRef = doc(db, COLLECTIONS.COMPLAINTS, complaintId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Complaint;
}

/**
 * Get all complaints with optional filters
 */
export async function getComplaints(options?: {
  status?: ComplaintStatus;
  assignedTo?: string;
  orderByField?: 'createdAt' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
}): Promise<Complaint[]> {
  const complaintsRef = collection(db, COLLECTIONS.COMPLAINTS);
  const constraints: QueryConstraint[] = [];
  
  if (options?.status) {
    constraints.push(where('status', '==', options.status));
  }
  
  if (options?.assignedTo) {
    constraints.push(where('assignedTo', '==', options.assignedTo));
  }
  
  constraints.push(
    orderBy(options?.orderByField || 'createdAt', options?.orderDirection || 'desc')
  );
  
  if (options?.limitCount) {
    constraints.push(limit(options.limitCount));
  }
  
  const q = query(complaintsRef, ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Complaint[];
}

/**
 * Update a complaint
 */
export async function updateComplaint(
  complaintId: string,
  updates: UpdateComplaintInput
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.COMPLAINTS, complaintId);
  
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a complaint and all its timeline entries
 */
export async function deleteComplaint(complaintId: string): Promise<void> {
  const batch = writeBatch(db);
  
  // Delete all timeline entries first
  const timelineRef = collection(db, COLLECTIONS.COMPLAINTS, complaintId, COLLECTIONS.TIMELINE);
  const timelineSnapshot = await getDocs(timelineRef);
  
  timelineSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // Delete the complaint document
  const complaintRef = doc(db, COLLECTIONS.COMPLAINTS, complaintId);
  batch.delete(complaintRef);
  
  await batch.commit();
}

// ============================================
// STATUS OPERATIONS
// ============================================

/**
 * Change complaint status
 */
export async function changeStatus(
  complaintId: string,
  input: StatusChangeInput
): Promise<TimelineEntry> {
  const complaintRef = doc(db, COLLECTIONS.COMPLAINTS, complaintId);
  const complaint = await getComplaint(complaintId);
  
  if (!complaint) {
    throw new Error('Complaint not found');
  }
  
  const now = Timestamp.now();
  const previousStatus = complaint.status;
  
  // Update complaint status
  const updateData: Partial<Complaint> = {
    status: input.newStatus,
    updatedAt: now,
  };
  
  // Set resolved/closed timestamps
  if (input.newStatus === 'resolved' && !complaint.resolvedAt) {
    updateData.resolvedAt = now;
  }
  if (input.newStatus === 'closed' && !complaint.closedAt) {
    updateData.closedAt = now;
  }
  
  await updateDoc(complaintRef, updateData);
  
  // Add timeline entry
  const timelineRef = collection(complaintRef, COLLECTIONS.TIMELINE);
  const timelineEntry: Omit<TimelineEntry, 'id'> = {
    type: 'status_change',
    previousStatus,
    newStatus: input.newStatus,
    statusNote: input.statusNote,
    createdAt: now,
    createdBy: input.createdBy,
  };
  
  const docRef = await addDoc(timelineRef, timelineEntry);
  
  return {
    id: docRef.id,
    ...timelineEntry,
  } as TimelineEntry;
}

/**
 * Assign complaint to someone
 */
export async function assignComplaint(
  complaintId: string,
  input: AssignmentInput
): Promise<TimelineEntry> {
  const complaintRef = doc(db, COLLECTIONS.COMPLAINTS, complaintId);
  const complaint = await getComplaint(complaintId);
  
  if (!complaint) {
    throw new Error('Complaint not found');
  }
  
  const now = Timestamp.now();
  const previousAssignee = complaint.assignedTo;
  
  // Update complaint
  await updateDoc(complaintRef, {
    assignedTo: input.newAssignee,
    updatedAt: now,
  });
  
  // Add timeline entry
  const timelineRef = collection(complaintRef, COLLECTIONS.TIMELINE);
  const timelineEntry: Omit<TimelineEntry, 'id'> = {
    type: 'assignment',
    previousAssignee,
    newAssignee: input.newAssignee,
    createdAt: now,
    createdBy: input.createdBy,
  };
  
  const docRef = await addDoc(timelineRef, timelineEntry);
  
  return {
    id: docRef.id,
    ...timelineEntry,
  } as TimelineEntry;
}

// ============================================
// TIMELINE OPERATIONS
// ============================================

/**
 * Get timeline entries for a complaint
 */
export async function getTimeline(complaintId: string): Promise<TimelineEntry[]> {
  const timelineRef = collection(
    db,
    COLLECTIONS.COMPLAINTS,
    complaintId,
    COLLECTIONS.TIMELINE
  );
  
  const q = query(timelineRef, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as TimelineEntry[];
}

/**
 * Add a comment to a complaint
 */
export async function addComment(
  complaintId: string,
  input: AddCommentInput
): Promise<TimelineEntry> {
  const complaintRef = doc(db, COLLECTIONS.COMPLAINTS, complaintId);
  const now = Timestamp.now();
  
  // Update complaint's updatedAt and increment comment count
  await updateDoc(complaintRef, {
    updatedAt: now,
    commentCount: increment(1),
  });
  
  // Add timeline entry
  const timelineRef = collection(complaintRef, COLLECTIONS.TIMELINE);
  const timelineEntry: Omit<TimelineEntry, 'id'> = {
    type: 'comment',
    content: input.content,
    createdAt: now,
    createdBy: input.createdBy,
  };
  
  const docRef = await addDoc(timelineRef, timelineEntry);
  
  return {
    id: docRef.id,
    ...timelineEntry,
  } as TimelineEntry;
}

/**
 * Add an attachment entry to the timeline
 */
export async function addAttachment(
  complaintId: string,
  input: AddAttachmentInput
): Promise<TimelineEntry> {
  const complaintRef = doc(db, COLLECTIONS.COMPLAINTS, complaintId);
  const now = Timestamp.now();
  
  // Update complaint's updatedAt
  await updateDoc(complaintRef, {
    updatedAt: now,
  });
  
  // Add timeline entry
  const timelineRef = collection(complaintRef, COLLECTIONS.TIMELINE);
  const timelineEntry: Omit<TimelineEntry, 'id'> = {
    type: 'attachment',
    attachment: input.attachment,
    createdAt: now,
    createdBy: input.createdBy,
  };
  
  const docRef = await addDoc(timelineRef, timelineEntry);
  
  return {
    id: docRef.id,
    ...timelineEntry,
  } as TimelineEntry;
}

/**
 * Delete a timeline entry
 */
export async function deleteTimelineEntry(
  complaintId: string,
  timelineId: string
): Promise<void> {
  const timelineRef = doc(
    db,
    COLLECTIONS.COMPLAINTS,
    complaintId,
    COLLECTIONS.TIMELINE,
    timelineId
  );
  
  // Get the entry first to check if it's a comment
  const entrySnap = await getDoc(timelineRef);
  const entryData = entrySnap.data();
  
  // Delete the timeline entry
  await deleteDoc(timelineRef);
  
  // If it was a comment, decrement the comment count
  if (entryData?.type === 'comment') {
    const complaintRef = doc(db, COLLECTIONS.COMPLAINTS, complaintId);
    await updateDoc(complaintRef, {
      commentCount: increment(-1),
    });
  }
}
