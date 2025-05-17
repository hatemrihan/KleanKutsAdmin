import { mongooseConnect } from "../mongoose";
import { Category } from "../../models/category";
import { CategoryRequest } from "../../types/category";
import { NextResponse } from "next/server";
import { processCategoryImage } from "../../utils/imageUtils";

export async function getCategories() {
    try {
        await mongooseConnect();
        const categories = await Category.find({ deleted: { $ne: true } })
            .sort({ displayOrder: 1, createdAt: -1 });
        return { success: true, data: categories };
    } catch (error) {
        console.error('Error fetching categories:', error);
        return { success: false, error: 'Failed to fetch categories' };
    }
}

export async function createCategory(data: CategoryRequest) {
    try {
        await mongooseConnect();

        // Validate required fields
        if (!data.name?.trim()) {
            return { success: false, error: 'Category name is required' };
        }

        // Create slug from name
        const slug = data.name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // Check for duplicate name
        const existing = await Category.findOne({
            name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
            deleted: { $ne: true }
        });

        if (existing) {
            return { success: false, error: 'Category with this name already exists' };
        }

        // Process image URLs through our utility function
        const processedImage = data.image ? processCategoryImage(data.image) : null;
        const processedMobileImage = data.mobileImage ? processCategoryImage(data.mobileImage) : null;
        const processedFeaturedImage = data.featuredImage ? processCategoryImage(data.featuredImage) : null;
        const processedAdditionalImages = data.additionalImages?.map(img => processCategoryImage(img)) || [];

        // Create category with enhanced fields
        const category = await Category.create({
            name: data.name.trim(),
            slug,
            description: data.description?.trim(),
            headline: data.headline?.trim(),
            subheadline: data.subheadline?.trim(),
            displayOrder: data.displayOrder || 0,
            order: data.order || 0,
            callToAction: {
                text: data.callToAction?.text || 'EXPLORE',
                link: data.callToAction?.link || ''
            },
            customStyles: {
                textColor: data.customStyles?.textColor || '#000000',
                backgroundColor: data.customStyles?.backgroundColor || '',
                overlayOpacity: data.customStyles?.overlayOpacity || 0
            },
            isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
            parent: data.parent || null,
            parentCategory: data.parentCategory || data.parent || null,
            image: processedImage,
            featuredImage: processedFeaturedImage,
            mobileImage: processedMobileImage,
            additionalImages: processedAdditionalImages,
            desktopDescription: data.desktopDescription?.trim() || '',
            mobileDescription: data.mobileDescription?.trim() || '',
            layout: {
                desktop: {
                    imagePosition: data.layout?.desktop?.imagePosition || 'center',
                    textAlignment: data.layout?.desktop?.textAlignment || 'center'
                },
                mobile: {
                    imagePosition: data.layout?.mobile?.imagePosition || 'center',
                    textAlignment: data.layout?.mobile?.textAlignment || 'center'
                }
            },
            properties: data.properties || {},
            deleted: false
        });

        return { success: true, data: category };
    } catch (error) {
        console.error('Error creating category:', error);
        return { success: false, error: 'Failed to create category' };
    }
}

export async function updateCategory(id: string, data: Partial<CategoryRequest>) {
    try {
        await mongooseConnect();

        // Validate the ID
        if (!id) {
            return NextResponse.json(
                { error: "Category ID is required" },
                { status: 400 }
            );
        }

        // Check if category exists
        const existingCategory = await Category.findById(id);
        if (!existingCategory) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        // If parent is being updated, validate it
        if (data.parent) {
            // Check if parent exists
            const parentCategory = await Category.findById(data.parent);
            if (!parentCategory) {
                return NextResponse.json(
                    { error: "Parent category not found" },
                    { status: 400 }
                );
            }
            // Prevent circular references
            if (data.parent === id) {
                return NextResponse.json(
                    { error: "Category cannot be its own parent" },
                    { status: 400 }
                );
            }
        }

        // Generate slug if name is being updated
        if (data.name) {
            data.slug = data.name.toLowerCase().replace(/\s+/g, '-');
        }

        // Process images if they are being updated
        const updateData = { ...data };
        
        if (updateData.image) {
            updateData.image = processCategoryImage(updateData.image);
        }
        
        if (updateData.mobileImage) {
            updateData.mobileImage = processCategoryImage(updateData.mobileImage);
        }
        
        if (updateData.featuredImage) {
            updateData.featuredImage = processCategoryImage(updateData.featuredImage);
        }
        
        if (updateData.additionalImages && updateData.additionalImages.length > 0) {
            updateData.additionalImages = updateData.additionalImages.map(img => 
                processCategoryImage(img)
            );
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { 
                ...updateData,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!updatedCategory) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ 
            message: "Category updated successfully",
            category: updatedCategory
        });
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
        );
    }
}

export async function deleteCategory(id: string, permanent: boolean = true) {
    try {
        await mongooseConnect();

        if (permanent) {
            const result = await Category.findByIdAndDelete(id);
            if (!result) {
                return { success: false, error: 'Category not found' };
            }
            return { success: true, message: 'Category permanently deleted' };
        } else {
            const result = await Category.findByIdAndUpdate(id, {
                deleted: true,
                deletedAt: new Date()
            });
            if (!result) {
                return { success: false, error: 'Category not found' };
            }
            return { success: true, message: 'Category marked as deleted' };
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        return { success: false, error: 'Failed to delete category' };
    }
}

export async function restoreCategory(id: string) {
    try {
        await mongooseConnect();

        const result = await Category.findByIdAndUpdate(id, {
            $unset: { deleted: "", deletedAt: "" }
        });

        if (!result) {
            return { success: false, error: 'Category not found' };
        }

        return { success: true, message: 'Category restored successfully' };
    } catch (error) {
        console.error('Error restoring category:', error);
        return { success: false, error: 'Failed to restore category' };
    }
}

export async function getCategory(id: string) {
    try {
        await mongooseConnect();
        const category = await Category.findById(id);
        
        if (!category) {
            return { success: false, error: 'Category not found' };
        }
        
        return { success: true, data: category };
    } catch (error) {
        console.error('Error fetching category:', error);
        return { success: false, error: 'Failed to fetch category' };
    }
} 