/**
 * Helper function for the storefront to fetch only active categories
 * 
 * Example usage:
 * import { fetchActiveCategories } from '@/components/FetchActiveCategories';
 * 
 * const HomePage = async () => {
 *   const categories = await fetchActiveCategories();
 *   return (
 *     <div>
 *       {categories.map(category => (
 *         <div key={category._id}>{category.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 */

export async function fetchActiveCategories() {
  try {
    // Use the dedicated storefront endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/storefront/categories`, {
      cache: 'no-store', // Ensures fresh data on each request
    });

    if (!response.ok) {
      console.error('Failed to fetch active categories:', response.statusText);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching active categories:', error);
    return [];
  }
}

/**
 * Fetch a single category by ID (will return even if inactive)
 */
export async function fetchCategoryById(id) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/categories/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Failed to fetch category with ID ${id}:`, response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching category with ID ${id}:`, error);
    return null;
  }
} 