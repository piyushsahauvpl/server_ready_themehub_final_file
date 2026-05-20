-- Create Customer Support User
-- Email: support@test.com
-- Password: Support@07

USE themehub_db;

-- Insert support user if not exists
INSERT INTO users (full_name, email, password, role, status) 
VALUES (
    'Customer Support',
    'support@test.com',
    '$2y$10$EYKBZ6YfZmsJ0dGY91ebVeUAhhYE9siKTSQXOt1HSbUOX4Q6kG4Py', -- Password: Support@07
    'support',
    'active'
)
ON DUPLICATE KEY UPDATE 
    role = 'support',
    status = 'active',
    password = '$2y$10$EYKBZ6YfZmsJ0dGY91ebVeUAhhYE9siKTSQXOt1HSbUOX4Q6kG4Py';

-- Verify the user was created
SELECT id, full_name, email, role, status FROM users WHERE email = 'support@test.com';
