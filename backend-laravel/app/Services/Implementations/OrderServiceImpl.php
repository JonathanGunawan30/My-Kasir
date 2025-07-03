<?php

namespace App\Services\Implementations;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Services\Interfaces\OrderService;
use Exception;
use Illuminate\Support\Facades\DB;

class OrderServiceImpl implements OrderService
{
    const TAX_RATE = 0.11;

    public function createOrder(array $data)
    {
        return DB::transaction(function () use ($data) {
            $calculatedSubtotal = 0;
            $discount = $data['discount'] ?? 0;

            $date = now()->format('ymd');
            $orderCountToday = Order::whereDate('order_date', now()->toDateString())->count() + 1;
            $receiptNumber = 'TRX-' . $date . '-' . str_pad($orderCountToday, 5, '0', STR_PAD_LEFT);

            if ($discount > 0 && !empty($data['customer_id'])) {
                $customer = Customer::findOrFail($data['customer_id']);
                if ($customer->saldo < $discount) {
                    throw new \Exception("Customer's balance is insufficient for the requested discount.");
                }
            } elseif ($discount > 0 && empty($data['customer_id'])) {
                throw new \Exception("Cannot apply a discount without a customer.");
            }

            $order = Order::create([
                'customer_id'    => $data['customer_id'] ?? null,
                'user_id'        => $data['user_id'],
                'order_date'     => now(),
                'status'         => 'pending',
                'total'          => 0,
                'payment_method' => $data['payment_method'],
                'discount'       => $discount,
                'tax_amount'     => 0,
                'grand_total'    => 0,
                'receipt_number' => $receiptNumber,
            ]);

            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $price = $product->price;
                $quantity = $item['quantity'];

                if ($product->stock < $quantity) {
                    throw new \Exception("Stock for product {$product->name} is not enough. Available: {$product->stock}, Requested: {$quantity}");
                }

                $subtotal = $price * $quantity;

                OrderDetail::create([
                    'order_id'   => $order->id,
                    'product_id' => $product->id,
                    'quantity'   => $quantity,
                    'price'      => $price,
                    'subtotal'   => $subtotal,
                ]);

                $product->decrement('stock', $quantity);

                $calculatedSubtotal += $subtotal;
            }

            $subtotalAfterDiscount = $calculatedSubtotal - $discount;
            if ($subtotalAfterDiscount < 0) {
                $subtotalAfterDiscount = 0;
            }

            $calculatedTaxAmount = $subtotalAfterDiscount * self::TAX_RATE;
            $calculatedGrandTotal = $subtotalAfterDiscount + $calculatedTaxAmount;

            $order->update([
                'total'       => $calculatedSubtotal,
                'tax_amount'  => $calculatedTaxAmount,
                'grand_total' => $calculatedGrandTotal,
            ]);

            if ($discount > 0 && !empty($data['customer_id'])) {
                $customer->decrement('saldo', $discount);
            }

            if (!empty($data['customer_id'])) {
                $reward = $this->getCustomerReward($calculatedSubtotal);
                if ($reward > 0) {
                    $order->customer->increment('saldo', $reward);
                }
            }

            return $order->load('details.product', 'customer', 'user');
        });
    }

    function getCustomerReward($total)
    {
        $rewardTiers = config('reward');
        $reward = 0;

        foreach ($rewardTiers as $tier) {
            if ($total >= $tier['min_total']) {
                $reward = $tier['bonus'];
            }
        }

        return $reward;
    }

    public function getAllOrders()
    {
        return Order::with([
            'customer',
            'user',
            'details.product'
        ])->orderByDesc('order_date')->get();
    }

    public function getOrderById($id)
    {
        $order = Order::with('details.product', "customer", "user")->find($id);
        if (!$order) {
            throw new \Exception("Order not found", 404);
        }
        return $order;
    }

    public function searchOrdersByCustomerName(string $name)
    {
        return Order::with(['details.product', 'customer', 'user'])
            ->whereHas('customer', function ($query) use ($name) {
                $query->where('name', 'like', '%' . $name . '%');
            })
            ->orderByDesc('order_date')
            ->get();
    }

    public function updateOrder($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $order = Order::with('customer', 'details.product')->findOrFail($id);

            $oldCustomerId = $order->customer_id;
            $oldSubtotal = $order->total;
            $oldDiscount = $order->discount ?? 0;

            $newCustomerId = array_key_exists('customer_id', $data) ? $data['customer_id'] : null;
            $newDiscount = $data['discount'] ?? 0;

            if ($oldDiscount != $newDiscount) {
                if ($oldCustomerId) {
                    $customer = Customer::find($oldCustomerId);
                    if ($customer) {
                        $customer->increment('saldo', $oldDiscount);
                    }
                }

                if ($newDiscount > 0 && $newCustomerId) {
                    $customer = Customer::find($newCustomerId);
                    if ($customer) {
                        if ($customer->saldo < $newDiscount) {
                            throw new \Exception("Customer's balance is insufficient for the new discount.");
                        }
                        $customer->decrement('saldo', $newDiscount);
                    }
                }
            }


            $orderDataToUpdate = $data;
            unset($orderDataToUpdate['items']);
            $order->fill($orderDataToUpdate);

            if (isset($data['items']) && is_array($data['items'])) {
                $productStockChanges = [];

                foreach ($order->details as $oldDetail) {
                    $productStockChanges[$oldDetail->product_id] = ($productStockChanges[$oldDetail->product_id] ?? 0) + $oldDetail->quantity;
                }

                $order->details()->delete();

                $newDetails = [];
                $calculatedNewSubtotal = 0;

                foreach ($data['items'] as $item) {
                    if (!isset($item['product_id']) || !isset($item['quantity'])) {
                        throw new Exception("Invalid item data for order details.");
                    }

                    $product = Product::findOrFail($item['product_id']);
                    $quantity = $item['quantity'];

                    if ($product->stock + ($productStockChanges[$product->id] ?? 0) < $quantity) {
                        throw new Exception("Stock for product {$product->name} is not enough for the new quantity. Available: {$product->stock}, Requested: {$quantity}");
                    }

                    $subtotal = $quantity * $product->price;

                    $newDetails[] = new OrderDetail([
                        'order_id' => $order->id,
                        'product_id' => $item['product_id'],
                        'quantity'   => $quantity,
                        'price'      => $product->price,
                        'subtotal'   => $subtotal,
                    ]);

                    $calculatedNewSubtotal += $subtotal;

                    $productStockChanges[$product->id] = ($productStockChanges[$product->id] ?? 0) - $quantity;
                }
                $order->details()->saveMany($newDetails);

                foreach ($productStockChanges as $productId => $change) {
                    $product = Product::findOrFail($productId);
                    if ($change > 0) {
                        $product->increment('stock', $change);
                    } elseif ($change < 0) {
                        $product->decrement('stock', abs($change));
                    }
                }

                $subtotalAfterDiscount = $calculatedNewSubtotal - $newDiscount;
                if ($subtotalAfterDiscount < 0) $subtotalAfterDiscount = 0;

                $newTaxAmount = $subtotalAfterDiscount * self::TAX_RATE;
                $newGrandTotal = $subtotalAfterDiscount + $newTaxAmount;

                $order->total       = $calculatedNewSubtotal;
                $order->discount    = $newDiscount;
                $order->tax_amount  = $newTaxAmount;
                $order->grand_total = $newGrandTotal;
            }

            $order->save();

            $newReward = $this->getCustomerReward($order->total);
            $oldReward = $this->getCustomerReward($oldSubtotal);

            if ($oldCustomerId != $newCustomerId) {
                if ($oldCustomerId) {
                    Customer::find($oldCustomerId)?->decrement('saldo', $oldReward);
                }
                if ($newCustomerId) {
                    Customer::find($newCustomerId)?->increment('saldo', $newReward);
                }
            } else {
                if ($oldReward !== $newReward) {
                    if ($oldCustomerId) {
                        if ($oldReward > $newReward) {
                            Customer::find($oldCustomerId)?->decrement('saldo', $oldReward - $newReward);
                        } else {
                            Customer::find($oldCustomerId)?->increment('saldo', $newReward - $oldReward);
                        }
                    }
                }
            }

            return $order->load('details.product', 'customer', 'user');
        });
    }

    public function deleteOrder($id)
    {
        return DB::transaction(function () use ($id) {
            $order = Order::with('details.product', 'customer')->findOrFail($id);

            if ($order->discount > 0 && $order->customer_id) {
                $order->customer->increment('saldo', $order->discount);
            }

            if ($order->customer_id) {
                $reward = $this->getCustomerReward($order->total);
                if ($reward > 0) {
                    $order->customer->decrement('saldo', $reward);
                }
            }

            foreach ($order->details as $detail) {
                $detail->product->increment('stock', $detail->quantity);
            }

            $order->details()->delete();
            $order->delete();

            return true;
        });
    }

    public function addOrderDetail($orderId, array $data)
    {
        return DB::transaction(function () use ($orderId, $data) {
            $order = Order::with('customer', 'details')->findOrFail($orderId);
            $product = Product::findOrFail($data['product_id']);

            if ($product->stock < $data['quantity']) {
                throw new \Exception('Insufficient stock.');
            }

            $subtotalOfNewItem = $product->price * $data['quantity'];

            OrderDetail::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'quantity' => $data['quantity'],
                'price' => $product->price,
                'subtotal' => $subtotalOfNewItem,
            ]);

            $product->decrement('stock', $data['quantity']);

            $newTotalSubtotal = $order->total + $subtotalOfNewItem;
            $subtotalAfterDiscount = $newTotalSubtotal - ($order->discount ?? 0);
            $newTaxAmount = $subtotalAfterDiscount * self::TAX_RATE;
            $newGrandTotal = $subtotalAfterDiscount + $newTaxAmount;

            if ($order->customer) {
                $oldReward = $this->getCustomerReward($order->total);
                $newReward = $this->getCustomerReward($newTotalSubtotal);

                if ($oldReward !== $newReward) {
                    if ($oldReward > $newReward) {
                        $order->customer->decrement('saldo', $oldReward - $newReward);
                    } else {
                        $order->customer->increment('saldo', $newReward - $oldReward);
                    }
                }
            }

            $order->update([
                'total'       => $newTotalSubtotal,
                'tax_amount'  => $newTaxAmount,
                'grand_total' => $newGrandTotal,
            ]);


            return $order->load('details.product', 'customer', 'user');
        });
    }

    public function removeOrderDetail($orderId, $detailId)
    {
        return DB::transaction(function () use ($orderId, $detailId) {
            $order = Order::with('customer', 'details')->findOrFail($orderId);

            $detailToRemove = $order->details->firstWhere('id', $detailId);

            if (!$detailToRemove) {
                throw new \Exception("Order detail not found.");
            }

            if ($order->details->count() === 1 && $detailToRemove->id === $detailId) {
                throw new \Exception('Order must have at least one detail. Cannot remove the last detail. Consider deleting the entire order instead.');
            }

            $product = Product::findOrFail($detailToRemove->product_id);

            $product->increment('stock', $detailToRemove->quantity);

            $newTotalSubtotal = $order->total - $detailToRemove->subtotal;
            if ($newTotalSubtotal < 0) {
                $newTotalSubtotal = 0;
            }

            $subtotalAfterDiscount = $newTotalSubtotal - ($order->discount ?? 0);
            $newTaxAmount = $subtotalAfterDiscount * self::TAX_RATE;
            $newGrandTotal = $subtotalAfterDiscount + $newTaxAmount;

            if ($order->customer) {
                $oldReward = $this->getCustomerReward($order->total);
                $newReward = $this->getCustomerReward($newTotalSubtotal);

                if ($oldReward !== $newReward) {
                    if ($oldReward > $newReward) {
                        $order->customer->decrement('saldo', $oldReward - $newReward);
                    } else {
                        $order->customer->increment('saldo', $newReward - $oldReward);
                    }
                }
            }

            $detailToRemove->delete();

            $order->update([
                'total'       => $newTotalSubtotal,
                'tax_amount'  => $newTaxAmount,
                'grand_total' => $newGrandTotal,
            ]);

            return $order->load('details.product', 'customer');
        });
    }

    public function updateStatus($data, $id)
    {
        return Order::findOrFail($id)->update($data);
    }
}
