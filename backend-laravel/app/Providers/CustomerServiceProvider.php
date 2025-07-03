<?php

namespace App\Providers;

use App\Services\Implementations\CustomerServiceImpl;
use App\Services\Interfaces\CustomerService;
use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;

class CustomerServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public array $singletons = [
        CustomerService::class => CustomerServiceImpl::class
    ];

    public function provides(): array
    {
        return [CustomerService::class];
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
