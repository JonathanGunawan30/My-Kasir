<?php

namespace App\Exceptions;

use Exception;

class UserDeleteSelfException extends Exception
{
    public function __construct($message = "You cannot delete yourself.", $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
