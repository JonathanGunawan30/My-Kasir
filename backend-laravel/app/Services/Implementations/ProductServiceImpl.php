<?php

namespace App\Services\Implementations;

use App\Models\Product;
use App\Services\Interfaces\ProductService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ProductServiceImpl implements ProductService
{
    public function createProduct(array $data)
    {
        return Product::create($data);
    }

    public function getProductById($id)
    {
        $product = Product::find($id);

        if(!$product){
            throw new ModelNotFoundException();
        }

        return $product;
    }

    public function searchProducts($name = null)
    {
        $query = Product::query();

        if ($name) {
            $query->where('name', 'like', '%' . $name . '%');
        }

        return $query->get();
    }

    public function updateProduct($id, array $data)
    {
        $product = Product::findOrFail($id);
        $product->update($data);
        return $product->load("category");
    }

    public function deleteProduct($id)
    {
        $product = Product::with('orderDetails')->findOrFail($id);

        if ($product->orderDetails()->exists()) {
            throw new \Exception("Product has related order details and cannot be deleted.");
        }

        $product->forceDelete();
        return $product;
    }
}
