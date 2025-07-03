<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Services\Interfaces\ProductService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    protected $productService;
    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    public function store(CreateProductRequest $request)
    {
        try {
            $data = $request->validated();

            $product = $this->productService->createProduct($data);
            $product->load("category");
            return response()->json([
                'data' => $product,
                "message" => "Product created successfully.",
                "statusCode" => 201
            ], 201);
        } catch (\Throwable $th) {
            return response()->json([
                "errors" => [
                    "message" => "Something went wrong"
                ],
                "statusCode" => 500,
            ], 500);
        }
    }

    public function index()
    {
        try {
            $products = Product::all();
            $products->load("category");
            return response()->json([
                'data' => $products,
                "message" => "Products retrieved successfully.",
                "statusCode" => 200
            ]);
        } catch (\Throwable $th) {
            return response()->json([
                "errors" => [
                    "message" => "Something went wrong"
                ],
                "statusCode" => 500,
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $data = $this->productService->getProductById($id);
            $data->load("category");
            return response()->json([
                'data' => $data,
                "message" => "Product retrieved successfully.",
                "statusCode" => 200
            ]);
        } catch (ModelNotFoundException $th) {
            return response()->json([
                "errors" => [
                    "message" => "Product not found."
                ],
                "statusCode" => 404,
            ], 404);
        }
        catch (\Throwable $th) {
            return response()->json([
                "errors" => [
                    "message" => "Something went wrong"
                ],
                "statusCode" => 500,
            ], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $data = $this->productService->searchProducts($request->input('name'));
            $data->load("category");
            if ($data->isEmpty()) {
                return response()->json([
                    'errors' => ['message' => 'No products found.'],
                    'statusCode' => 404
                ], 404);
            }
            return response()->json([
                'data' => $data,
                "message" => "Products retrieved successfully.",
                "statusCode" => 200
            ]);
        } catch (\Throwable $th) {
            return response()->json([
                "errors" => [
                    "message" => "Something went wrong"
                ],
                "statusCode" => 500,
            ], 500);
        }
    }

    public function update(UpdateProductRequest $request, $id)
    {
        try {
            $data = $request->validated();
            $product = $this->productService->updateProduct($id, $data);

            return response()->json([
                'data' => $product,
                "message" => "Product updated successfully.",
                "statusCode" => 200
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                "errors" => ["message" => "Product not found."],
                "statusCode" => 404,
            ], 404);
        } catch (\Throwable $e) {
            return response()->json([
                "errors" => ["message" => "Something went wrong"],
                "statusCode" => 500,
            ], 500);
        }
    }


    public function destroy($id)
    {
        try {
            $product = $this->productService->deleteProduct($id);
            return response()->json([
                'data' => [
                    "message" => "Product deleted successfully.",
                ],
                "statusCode" => 200
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                "errors" => ["message" => "Product not found."],
                "statusCode" => 404,
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                "errors" => ["message" => $e->getMessage()],
                "statusCode" => 400,
            ], 400);
        } catch (\Throwable $e) {
            return response()->json([
                "errors" => ["message" => "Something went wrong"],
                "statusCode" => 500,
            ], 500);
        }
    }



}
