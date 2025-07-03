<?php

namespace App\Exceptions;

use Exception;

class CategoryHasProductException extends Exception
{
    public function __construct($message = "Category product cannot be deleted because it still have relation to product", $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
