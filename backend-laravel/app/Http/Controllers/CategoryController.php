<?php

namespace App\Http\Controllers;

use App\Exceptions\CategoryHasProductException;
use App\Http\Requests\CreateCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\CategoryProduct;
use App\Services\Interfaces\CategoryService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    protected $categoryService;
    public function __construct(CategoryService $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    public function store(CreateCategoryRequest $request)
    {
        $data = $request->validated();

        $category = CategoryProduct::create($data);
        return response()->json([
            "data" => $category,
            "message" => "Category created successfully",
            "statusCode" => 201
        ], 201);
    }

    public function index()
    {
        $categories = CategoryProduct::all();
        return response()->json([
            "data" => $categories,
            "message" => "Categories retrieved successfully",
            "statusCode" => 200
        ]);
    }

    public function show($id)
    {
        try {
            $category = $this->categoryService->getCategoryById($id);
            return response()->json([
                'data' => $category,
                'message' => 'Category retrieved successfully',
                'statusCode' => 200
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                "errors" => [
                    "message" => "Category not found"
                ],
                "statusCode" => 404
            ], 404);
        }
        catch (\Throwable $e) {
            return response()->json([
                "errors" => [
                    "message" => "Something went wrong",
                ],
                "statusCode" => 500
            ], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = CategoryProduct::query();

            if ($request->has('name')) {
                $query->where('name', 'like', '%' . $request->input('name') . '%');
            }

            $categories = $query->get();

            if ($categories->isEmpty()) {
                return response()->json([
                    'errors' => ['message' => 'No categories found.'],
                    'statusCode' => 404
                ], 404);
            }

            return response()->json([
                'data' => $categories,
                'message' => 'Categories retrieved successfully.',
                'statusCode' => 200
            ]);
        } catch (\Throwable $e){
            return response()->json([

                "errors" => [
                    "message" => "Something went wrong"
                ],
                "statusCode" => 500
            ], 500);
        }
    }

    public function update(UpdateCategoryRequest $request, $id)
    {
        try {
            $data = $request->validated();
            $category = $this->categoryService->updateCategory($id, $data);

            return response()->json([
                'data' => $category,
                'message' => 'Category updated successfully',
                'statusCode' => 200
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                "errors" => ["message" => "Category not found"],
                "statusCode" => 404
            ], 404);
        } catch (\Throwable $e) {
            return response()->json([
                "errors" => ["message" => "Something went wrong"],
                "statusCode" => 500
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $category = $this->categoryService->hardDeleteCategory($id);

            return response()->json([
                'data' => $category,
                'message' => 'Category deleted permanently',
                'statusCode' => 200
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                "errors" => ["message" => "Category not found"],
                "statusCode" => 404
            ], 404);
        } catch (CategoryHasProductException $e){
            return response()->json([
                "errors" => ["message" => $e->getMessage()],
                "statusCode" => 403
            ], 403);
        }
        catch (\Throwable $e) {
            return response()->json([
                "errors" => ["message" => "Something went wrong"],
                "statusCode" => 500
            ], 500);
        }
    }
}
