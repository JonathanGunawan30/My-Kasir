<?php

namespace App\Providers;

use App\Services\Implementations\OrderServiceImpl;
use App\Services\Interfaces\OrderService;
use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;

class OrderServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public array $singletons = [
        OrderService::class => OrderServiceImpl::class
    ];
    public function provides()
    {
        return [OrderService::class];
    }

    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
