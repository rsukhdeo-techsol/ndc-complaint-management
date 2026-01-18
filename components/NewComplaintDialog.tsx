'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { X, Upload, FileIcon, Loader2 } from 'lucide-react';

import {
  CATEGORY_LABELS,
  COMPLAINT_CATEGORIES,
  SOURCE_LABELS,
  type AttachmentData,
  type ComplaintCategory,
  type ComplaintSource,
} from '@/types';
import { createComplaint, uploadAttachment } from '@/lib/services';
import { formatFileSize } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// ─────────────────────────────────────────────────────────────
// Schema (light MVP validation)
// ─────────────────────────────────────────────────────────────
const complaintSchema = z.object({
  complainantName: z.string().min(2, 'Name is required'),
  complainantPhone: z.string().optional().or(z.literal('')),
  complainantMobile: z.string().optional().or(z.literal('')),
  description: z.string().min(10, 'Description is required'),
  location: z.string().optional().or(z.literal('')),
  respondentName: z.string().optional().or(z.literal('')),
  source: z.enum(['phone', 'walk_in', 'councillor', 'chairman']),
  category: z
    .enum([...COMPLAINT_CATEGORIES] as [ComplaintCategory, ...ComplaintCategory[]])
    .optional(),
});

type ComplaintFormValues = z.infer<typeof complaintSchema>;

// Accepted file types for attachments
const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export function NewComplaintDialog({
  trigger,
  onCreated,
}: {
  trigger: React.ReactNode;
  onCreated?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      complainantName: '',
      complainantPhone: '',
      complainantMobile: '',
      description: '',
      location: '',
      respondentName: '',
      source: 'phone',
      category: 'other',
    },
  });

  // ─────────────────────────────────────────────────────────────
  // File handling
  // ─────────────────────────────────────────────────────────────
  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (ACCEPTED_TYPES.includes(file.type)) {
        validFiles.push(file);
      }
    }
    setSelectedFiles((prev) => [...prev, ...validFiles]);

    // Reset input so the same file can be selected again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // ─────────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────────
  async function onSubmit(values: ComplaintFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Temp ID for Storage folder (files uploaded before we have the Firestore doc ID)
      const tempId = `temp_${Date.now()}`;

      // Upload attachments to Storage
      let attachments: AttachmentData[] = [];
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map((file) =>
          uploadAttachment(tempId, file)
        );
        attachments = await Promise.all(uploadPromises);
      }

      // Create the complaint document in Firestore
      await createComplaint({
        complainantName: values.complainantName,
        complainantPhone: values.complainantPhone || undefined,
        complainantMobile: values.complainantMobile || undefined,
        // Auto-generate title from description (first 50 chars)
        title:
          values.description.substring(0, 50) +
          (values.description.length > 50 ? '…' : ''),
        description: values.description,
        location: values.location || undefined,
        respondentName: values.respondentName || undefined,
        category: values.category,
        attachments: attachments.length > 0 ? attachments : undefined,
        source: values.source as ComplaintSource,
        // Phase 1: no auth; placeholder user
        createdBy: 'overseer',
      });

      // Reset & close
      form.reset();
      setSelectedFiles([]);
      setOpen(false);
      onCreated?.();
    } catch (e: any) {
      console.error('Complaint creation error:', e);
      console.error('Error code:', e?.code);
      console.error('Error message:', e?.message);
      const errorMsg = e?.code === 'permission-denied' 
        ? 'Permission denied. Firestore rules may not be deployed correctly.'
        : e?.message || 'Failed to create complaint. Check Firebase rules/connection and try again.';
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedFiles([]);
      setSubmitError(null);
    }
  }, [open, form]);

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent 
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>New Complaint</DialogTitle>
          <DialogDescription>
            Enter complaint details. Attachments are optional.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            {/* Complainant Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="complainantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complainant Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="complainantPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +592 xxx xxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="complainantMobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +592 xxx xxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Received Via + Category */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Received Via *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMPLAINT_CATEGORIES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {CATEGORY_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the complaint in detail…"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location + Respondent */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Lot 5, Enmore" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="respondentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Respondent Name (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Person being complained about" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Attachments (optional)</label>
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 p-6 transition-colors hover:border-muted-foreground/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload images, videos, or documents
                </p>
                <p className="text-xs text-muted-foreground/70">
                  JPG, PNG, GIF, MP4, PDF, DOC
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES.join(',')}
                className="hidden"
                onChange={handleFilesChange}
              />

              {/* Selected files list */}
              {selectedFiles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {selectedFiles.map((file, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-muted-foreground">
                          ({formatFileSize(file.size)})
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="ml-2 rounded p-1 hover:bg-muted-foreground/20"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Error message */}
            {submitError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {submitError}
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Submit Complaint'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
