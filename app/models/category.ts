import { Schema, model, models } from "mongoose";

const CategorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    headline: {
        type: String,
        default: ''
    },
    subheadline: {
        type: String,
        default: ''
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    callToAction: {
        text: { type: String, default: 'EXPLORE' },
        link: { type: String, default: '' }
    },
    customStyles: {
        textColor: { type: String, default: '#000000' },
        backgroundColor: { type: String, default: '' },
        overlayOpacity: { type: Number, default: 0 }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    image: {
        type: String,
        default: null
    },
    mobileImage: {
        type: String,
        default: null
    },
    additionalImages: {
        type: [String],
        default: []
    },
    desktopDescription: {
        type: String,
        default: ''
    },
    mobileDescription: {
        type: String,
        default: ''
    },
    layout: {
        desktop: {
            imagePosition: { type: String, enum: ['left', 'right', 'center'], default: 'center' },
            textAlignment: { type: String, enum: ['left', 'right', 'center'], default: 'center' }
        },
        mobile: {
            imagePosition: { type: String, enum: ['top', 'bottom', 'center'], default: 'center' },
            textAlignment: { type: String, enum: ['left', 'right', 'center'], default: 'center' }
        }
    },
    properties: {
        type: Map,
        of: [String],
        default: {}
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

export const Category = models.Category || model('Category', CategorySchema); 