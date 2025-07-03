<?php

namespace App\Services\Implementations;

use App\Models\Customer;
use App\Services\Interfaces\CustomerService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class CustomerServiceImpl implements CustomerService
{

    public function createCustomer(array $data)
    {
        $data['saldo'] = $data['saldo'] ?? 0;
        return Customer::create($data);
    }

    public function getCustomerById($id)
    {
        $customer = Customer::find($id);

        if(!$customer){
            throw new ModelNotFoundException();
        }

        return $customer;
    }

    public function searchCustomer($name = null)
    {
        $query = Customer::query();
        if($name){
            $query->where('name', 'like', '%'.$name.'%');
        }
        return $query->get();
    }

    public function updateCustomer($id, array $data)
    {
        $customer = Customer::findOrFail($id);
        $customer->update($data);
        return $customer;
    }

    public function deleteCustomer($id)
    {
        $customer = Customer::with('orders')->findOrFail($id);

        if ($customer->orders()->exists()) {
            throw new \Exception("Customer has related orders and cannot be deleted.");
        }

        $customer->forceDelete();
        return $customer;
    }
}
