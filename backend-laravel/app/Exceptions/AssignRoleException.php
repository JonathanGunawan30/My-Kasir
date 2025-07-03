<?php

namespace App\Exceptions;

use Exception;

class AssignRoleException extends Exception
{
    public function __construct($message = "Role cannot be deleted because it has users", $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
