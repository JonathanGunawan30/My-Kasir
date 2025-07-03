<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use App\Services\Interfaces\CustomerService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    protected $customerService;
    public function __construct(CustomerService $customerService)
    {
        $this->customerService = $customerService;
    }

    public function store(CreateCustomerRequest $request)
    {
        try {
            $data = $request->validated();


            $customer = $this->customerService->createCustomer($data);
            return response()->json([
                "data" => $customer,
                "message" => "Customer created successfully.",
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
            $customers = Customer::all();
            return response()->json([
                "data" => $customers,
                "message" => "Customers retrieved successfully.",
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
            $data = $this->customerService->getCustomerById($id);
            return response()->json([
                'data' => $data,
                "message" => "Customer retrieved successfully.",
                "statusCode" => 200
            ]);
        } catch (ModelNotFoundException $th) {
            return response()->json([
                "errors" => [
                    "message" => "Customer not found."
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
            $data = $this->customerService->searchCustomer($request->input("name"));
            if($data->isEmpty()){
                return response()->json([
                    "errors" => [
                        "message" => "No customers found."
                    ],
                    "statusCode" => 404,
                ], 404);
            }
            return response()->json([
                "data" => $data,
                "message" => "Customers retrieved successfully.",
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

    public function update(UpdateCustomerRequest $request, $id)
    {
        try {
            $data = $request->validated();
            $customer = $this->customerService->updateCustomer($id, $data);
            return response()->json([
                "data" => $customer,
                "message" => "Customer updated successfully.",
                "statusCode" => 200
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                "errors" => ["message" => "Customer not found."],
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
            $customer = $this->customerService->deleteCustomer($id);
            return response()->json([
                "data" => [
                    "message" => "Customer deleted successfully."
                ],
                "statusCode" => 200
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                "errors" => ["message" => "Customer not found."],
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
