<?php

namespace App\Http\Controllers;

use App\Http\Requests\AddOrderDetailRequest;
use App\Http\Requests\CreateOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Requests\UpdateStatusRequest;
use App\Models\Order;
use App\Services\Interfaces\OrderService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    protected $orderService;
    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function store(CreateOrderRequest $request)
    {
        try {
            $data = $request->validated();
            $order = $this->orderService->createOrder($data);

            return response()->json([
                'data' => $order,
                'message' => 'Order created successfully.',
                'statusCode' => 201
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'errors' => ['message' => $e->getMessage()],
                'statusCode' => 400
            ], 400);
        } catch (\Throwable $th) {
            return response()->json([
                'errors' => ['message' => 'Something went wrong'],
                'statusCode' => 500
            ], 500);
        }
    }

    public function index(): JsonResponse
    {
        try {
            $orders = $this->orderService->getAllOrders();

            return response()->json([
                'data' => $orders,
                'message' => 'Orders retrieved successfully.',
                'statusCode' => 200
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

    public function show($id): JsonResponse
    {
        try {
            $order = $this->orderService->getOrderById($id);
            return response()->json([
                'data' => $order,
                'message' => 'Order retrieved successfully.',
                'statusCode' => 200
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'errors' => [
                    'message' => $e->getMessage()
                ],
                'statusCode' => $e->getCode() ?: 400,
            ], $e->getCode() ?: 400);
        } catch (\Throwable $e){
            return response()->json([
                "errors" => [
                    "message" => "Something went wrong",
                ],
                "statusCode" => 500
            ], 500);
        }
    }

    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string'
        ]);

        $orders = $this->orderService->searchOrdersByCustomerName($request->name);

        if ($orders->isEmpty()) {
            return response()->json([
                'errors' => ['message' => 'No orders found with given customer name.'], "statusCode" => 404
            ], 404);
        }

        return response()->json([
            'data' => $orders,
            'message' => 'Orders retrieved by customer name.',
            'statusCode' => 200
        ]);
    }

    public function update(UpdateOrderRequest $request, $id)
    {
        try {
            $data = $request->validated();

            $order = $this->orderService->updateOrder($id, $data);

            return response()->json([
                'data' => $order,
                'message' => 'Order updated successfully.',
                'statusCode' => 200
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'errors' => ['message' => 'Order not found.'],
                'statusCode' => 404
            ], 404);
        } catch (\Throwable $e) {
            return response()->json([
                'errors' => ['message' => 'Something went wrong'],
                'statusCode' => 500
            ], 500);
        }
    }
    public function destroy($id)
    {
        try {
            $this->orderService->deleteOrder($id);

            return response()->json([
                'data' => [
                    'message' => 'Order deleted successfully.',
                ],
                'statusCode' => 200
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'errors' => ['message' => 'Order not found.'],
                'statusCode' => 404
            ], 404);
        } catch (\Throwable $e) {
            return response()->json([
                'errors' => ['message' => 'Something went wrong'],
                'statusCode' => 500
            ], 500);
        }
    }
    public function addDetail(AddOrderDetailRequest $request, $orderId): JsonResponse
    {
        $request->validated();

        try {
            $order = $this->orderService->addOrderDetail($orderId, $request->only(['product_id', 'quantity']));

            return response()->json([
                'data' => $order,
                'message' => 'Order detail added successfully.',
                "statusCode" => 201
            ], 201);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'errors' => ['message' => 'Order not found.'],
                'statusCode' => 404
            ], 404);
        }
        catch (\Exception $e) {
            return response()->json([
                'errors' => [
                    'message' => $e->getMessage()
                ],
            ], 400);
        }
    }

    public function removeDetail($orderId, $detailId): JsonResponse
    {
        try {
            $this->orderService->removeOrderDetail($orderId, $detailId);

            return response()->json([
                'data' => [
                    'message' => 'Order detail removed successfully.',
                ],
                'statusCode' => 200
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'errors' => ['message' => 'Order or detail not found.'],
                'statusCode' => 404
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'errors' => ['message' => $e->getMessage()],
                'statusCode' => 400
            ], 400);
        }
    }

    public function updateStatus(UpdateStatusRequest $request, $id): JsonResponse
    {
        try {
            $data = $request->validated();
            $response = $this->orderService->updateStatus($data, $id);
            return response()->json([
                'data' => $response,
                'message' => 'Order status updated successfully.',
                'statusCode' => 200,
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'errors' => ['message' => 'Order not found.'],
                'statusCode' => 404
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'errors' => ['message' => $e->getMessage()],
                'statusCode' => 400
            ], 400);
        } catch (\Throwable $e) {
            return response()->json([
                'errors' => ['message' => 'Something went wrong'],
                'statusCode' => 500
            ], 500);
        }
    }




}
