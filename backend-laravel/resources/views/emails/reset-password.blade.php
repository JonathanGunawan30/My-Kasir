<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 20px; background-color: #f9fafb; font-family: system-ui, -apple-system, sans-serif;">
<div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #111827; margin: 0 0 24px 0; font-size: 28px; font-weight: 700;">
        Password Reset Request 🔒
    </h1>

    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 32px 0; font-size: 16px;">
        Hello, <strong>{{ $user->name }}</strong>. We received a request to reset your password. Click the button below to reset it.
    </p>

    <div style="text-align: center; margin-bottom: 32px;">
        <a href="{{ $resetUrl }}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Reset Password
        </a>
    </div>

    <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        If you did not request a password reset, you can ignore this email.
    </p>

    <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 13px; margin: 0;">
            This is an automated message. Please do not reply directly to this email.
        </p>
    </div>
</div>
</body>
</html>
