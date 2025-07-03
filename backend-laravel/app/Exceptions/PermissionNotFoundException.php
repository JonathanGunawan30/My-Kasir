<?php

namespace App\Exceptions;

use Exception;

class PermissionNotFoundException extends Exception
{
    public function __construct($message = "Permission Not Found", $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
