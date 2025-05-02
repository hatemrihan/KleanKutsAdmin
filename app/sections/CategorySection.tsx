'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Category {
  _id: string;
  name: string;
  description: string;
  parent?: string;
}

interface CategorySectionProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function CategorySection({ categories, selectedCategories, onCategoryChange }: CategorySectionProps) {
  const handleSelect = (categoryId: string) => {
    const syntheticEvent = {
      target: {
        value: categoryId,
        selectedOptions: [{ value: categoryId }]
      }
    } as unknown as React.ChangeEvent<HTMLSelectElement>;
    
    onCategoryChange(syntheticEvent);
  };

  return (
    <div className="mb-4">
      <Table>
        <TableCaption>Available Categories</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Category Name</TableHead>
            <TableHead>Parent Category</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow 
              key={category._id}
              className={selectedCategories.includes(category._id) ? "bg-muted/50" : ""}
            >
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>
                {category.parent 
                  ? categories.find(c => c._id === category.parent)?.name 
                  : "Main Category"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant={selectedCategories.includes(category._id) ? "secondary" : "default"}
                  onClick={() => handleSelect(category._id)}
                >
                  {selectedCategories.includes(category._id) ? "Selected" : "Add"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 