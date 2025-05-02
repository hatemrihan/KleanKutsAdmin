import mongoose, { Schema } from 'mongoose';

const productSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    selectedSizes: [String],
    gender: String,
    color: String,
    stock: { type: Number, default: 0 },
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
    updatedAt: { type: Date, default: Date.now }
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

// Ensure the model hasn't been compiled before
export const Product = mongoose.models?.Product || mongoose.model('Product', productSchema);

