import { Schema, model, models, Document } from 'mongoose';

// TypeScript interface for Event document
export interface IEvent extends Document {
    title: string;
    slug: string;
    description: string;
    overview: string;
    image: string;
    venue: string;
    location: string;
    date: string;
    time: string;
    mode: string;
    audience: string;
    agenda: string[];
    organizer: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        overview: {
            type: String,
            required: [true, 'Overview is required'],
            trim: true,
            maxlength: [500, 'Overview cannot exceed 500 characters'],
        },
        image: {
            type: String,
            required: [true, 'Image URL is required'],
            trim: true,
        },
        venue: {
            type: String,
            required: [true, 'Venue is required'],
            trim: true,
        },
        location: {
            type: String,
            required: [true, 'Location is required'],
            trim: true,
        },
        date: {
            type: String,
            required: [true, 'Date is required'],
        },
        time: {
            type: String,
            required: [true, 'Time is required'],
        },
        mode: {
            type: String,
            required: [true, 'Mode is required'],
            enum: {
                values: ['online', 'offline', 'hybrid'],
                message: 'Mode must be either online, offline, or hybrid',
            },
        },
        audience: {
            type: String,
            required: [true, 'Audience is required'],
            trim: true,
        },
        agenda: {
            type: [String],
            required: [true, 'Agenda is required'],
            validate: {
                validator: (v: string[]) => v.length > 0,
                message: 'At least one agenda item is required',
            },
        },
        organizer: {
            type: String,
            required: [true, 'Organizer is required'],
            trim: true,
        },
        tags: {
            type: [String],
            required: [true, 'Tags are required'],
            validate: {
                validator: (v: string[]) => v.length > 0,
                message: 'At least one tag is required',
            },
        },
    },
    {
        timestamps: true, // Auto-generate createdAt and updatedAt
    }
);

// Pre-save hook (async, TypeScript-safe)
EventSchema.pre('save', async function () {
    const event = this as IEvent;

    // Generate slug only if title changed or document is new
    if (event.isModified('title') || event.isNew) {
        event.slug = generateSlug(event.title);
    }

    // Normalize date
    if (event.isModified('date')) {
        event.date = normalizeDate(event.date);
    }

    // Normalize time
    if (event.isModified('time')) {
        event.time = normalizeTime(event.time);
    }
});

// Helper function to generate URL-friendly slug
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to normalize date (keeps string if invalid)
function normalizeDate(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        // Keep original string instead of throwing error
        return dateString;
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Helper function to normalize time (keeps string if invalid)
function normalizeTime(timeString: string): string {
    const cleaned = timeString.trim().toUpperCase();
    const fixed = cleaned.replace(/^(\d{1,2})(AM|PM)$/, '$1:00 $2');

    const timeRegex = /^(\d{1,2}):(\d{2})(\s*(AM|PM))?$/i;
    const match = fixed.match(timeRegex);
    if (!match) return timeString;

    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[4];

    if (period) {
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
    }

    return `${String(hours).padStart(2, '0')}:${minutes}`;
}

// Create unique index on slug
EventSchema.index({ slug: 1 }, { unique: true });

// Compound index for common queries
EventSchema.index({ date: 1, mode: 1 });

const Event = models.Event || model<IEvent>('Event', EventSchema);

export default Event;