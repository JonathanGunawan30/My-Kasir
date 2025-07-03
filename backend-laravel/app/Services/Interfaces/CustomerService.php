<?php

namespace App\Services\Interfaces;

interface CustomerService
{
    public function createCustomer(array $data);
    public function getCustomerById($id);
    public function searchCustomer($name = null);
    public function updateCustomer($id, array $data);
    public function deleteCustomer($id);
}
