import mongoose, { Schema } from 'mongoose';

// Schema for color variants within a size
const colorVariantSchema = new Schema({
    color: { type: String, required: true },
    stock: { type: Number, default: 0, required: true }
}, { _id: false });

// Schema for size variants
const sizeVariantSchema = new Schema({
    size: { type: String, required: true },
    colorVariants: [colorVariantSchema]
}, { _id: false });

const productSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    sizeVariants: [sizeVariantSchema],
    selectedSizes: [String], // Keep for backwards compatibility
    gender: String,
    color: String, // Keep for backwards compatibility
    stock: { type: Number, default: 0 }, // Keep for backwards compatibility
    discount: { type: Number, default: 0 },
    discountType: String,
    selectedImages: {
        type: [String],
        required: true,
        validate: {
            validator: function(v: string[]) {
                return Array.isArray(v) && v.length > 0;
            },
            message: 'At least one image URL is required'
        }
    },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    deleted: { type: Boolean, default: false },
    deletedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    name: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        default: []
    },
    mainImage: {
        type: String
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    featured: {
        type: Boolean,
        default: false
    },
    stockInfo: [{
        size: String,
        color: String,
        quantity: Number
    }],
    materials: {
        type: [String],
        default: []
    },
    sizeGuide: {
        type: String,
        default: ''
    },
    packaging: {
        type: String,
        default: ''
    },
    shippingReturns: {
        type: String,
        default: ''
    }
});

// Add a method to get full image URLs
productSchema.methods.getImageUrls = function() {
    return this.selectedImages.map((image: string) => {
        if (image.startsWith('http')) {
            return image;
        }
        // Assuming images are stored in a public folder
        return `/uploads/${image}`;
    });
};

// Update timestamp before saving
productSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// For TypeScript compatibility
interface ProductDocument extends mongoose.Document {
    title: string;
    description: string;
    price: number;
    sizeVariants: {
        size: string;
        colorVariants: {
            color: string;
            stock: number;
        }[];
    }[];
    selectedSizes: string[];
    gender: string;
    color: string;
    stock: number;
    discount: number;
    discountType: string;
    selectedImages: string[];
    categories: mongoose.Types.ObjectId[];
    deleted: boolean;
    deletedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    images: string[];
    mainImage?: string;
    category?: mongoose.Types.ObjectId;
    featured: boolean;
    stockInfo: {
        size: string;
        color: string;
        quantity: number;
    }[];
    materials: string[];
    sizeGuide: string;
    packaging: string;
    shippingReturns: string;
}

// Prevent duplicate model compilation error in development
export const Product = mongoose.models.Product || 
    mongoose.model<ProductDocument>('Product', productSchema);

