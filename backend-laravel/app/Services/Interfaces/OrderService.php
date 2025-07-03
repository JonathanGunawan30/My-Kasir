<?php

namespace App\Services\Interfaces;

interface OrderService
{
    public function createOrder(array $data);
    public function getAllOrders();
    public function getOrderById($id);
    public function searchOrdersByCustomerName(string $name);
    public function updateOrder($id, array $data);
    public function deleteOrder($id);
    public function addOrderDetail($orderId, array $data);
    public function removeOrderDetail($orderId, $detailId);
    public function updateStatus($data, $id);
}
