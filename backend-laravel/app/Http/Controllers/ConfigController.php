<?php

namespace App\Http\Controllers;


use Illuminate\Support\Facades\Response;

class ConfigController extends Controller
{
    public function getRewardTiers()
    {
        $rewardTiers = config('reward');

        return Response::json([
            'data' => $rewardTiers,
            'message' => 'Reward tiers configuration fetched successfully.',
        ]);
    }
}
