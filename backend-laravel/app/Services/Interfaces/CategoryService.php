<?php

namespace App\Services\Interfaces;

interface CategoryService
{
    public function getCategoryById($id);
    public function updateCategory($id, $data);
    public function hardDeleteCategory($id);
}
