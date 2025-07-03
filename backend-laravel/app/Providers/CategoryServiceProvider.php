<?php

namespace App\Providers;

use App\Services\Implementations\CategoryServiceImpl;
use App\Services\Interfaces\CategoryService;
use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;

class CategoryServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public array $singletons = [
        CategoryService::class => CategoryServiceImpl::class
    ];

    public function provides()
    {
        return [CategoryService::class];
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
