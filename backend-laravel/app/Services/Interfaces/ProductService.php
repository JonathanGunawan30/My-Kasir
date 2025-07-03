<?php

namespace App\Services\Interfaces;

interface ProductService
{
    public function createProduct(array $data);
    public function getProductById($id);
    public function searchProducts($name = null);
    public function updateProduct($id, array $data);
    public function deleteProduct($id);
}
