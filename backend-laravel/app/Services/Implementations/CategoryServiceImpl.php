<?php

namespace App\Services\Implementations;

use App\Exceptions\CategoryHasProductException;
use App\Models\CategoryProduct;
use App\Services\Interfaces\CategoryService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class CategoryServiceImpl implements CategoryService
{
    public function getCategoryById($id)
    {
        $category = CategoryProduct::find($id);

        if(!$category){
            throw new ModelNotFoundException();
        }

        return $category;
    }
    public function updateCategory($id, $data)
    {
        $category = CategoryProduct::findOrFail($id);
        $category->update($data);
        return $category;
    }

    public function hardDeleteCategory($id)
    {
        $category = CategoryProduct::findOrFail($id);
        if($category->products()->exists()){
            throw new CategoryHasProductException();
        }
        $category->forceDelete();
        return $category;
    }
}
