<?php

namespace App\Exceptions;

use Exception;

class UserHasOrdersException extends Exception
{
    public function __construct($message = "User cannot be deleted because it still have orders", $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
